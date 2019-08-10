---

layout: post
title:  "@synchronized 源码阅读笔记"
date:   2019-8-10 12:11:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS
  - 源码阅读
---



#  特点

1. 用着方便，可读性高（妈妈再也不用担心我忘记调用unclock 了）
2. @synchronized block在被保护的代码上暗中添加了一个异常处理。为的是同步某对象时如果抛出异常，锁会被释放掉。
3. 反正是我看到的、用的，第一个锁，在很久很久以前。

# 疑问

1. 锁是怎么与你传入的 @synchronized的对象关联上的？
2. 传入一个nil 会怎么样？
3. @synchronize 会retain 被锁住的对象么？
4. 如果你传入的 @synchronized的对象在@synchronized 的block里面被释放或者和被赋值为nil将会怎样？

# 源码

头文件

~~~c++
/** 
 * Begin synchronizing on 'obj'.  
 * Allocates recursive pthread_mutex associated with 'obj' if needed.//原来有一个递归锁啊
 * 
 * @param obj The object to begin synchronizing on.
 * 
 * @return OBJC_SYNC_SUCCESS once lock is acquired.  
 */
OBJC_EXPORT int
objc_sync_enter(id _Nonnull obj)
    OBJC_AVAILABLE(10.3, 2.0, 9.0, 1.0, 2.0);

/** 
 * End synchronizing on 'obj'. 
 * 
 * @param obj The object to end synchronizing on.
 * 
 * @return OBJC_SYNC_SUCCESS or OBJC_SYNC_NOT_OWNING_THREAD_ERROR
 */
OBJC_EXPORT int
objc_sync_exit(id _Nonnull obj)
    OBJC_AVAILABLE(10.3, 2.0, 9.0, 1.0, 2.0);

enum {
    OBJC_SYNC_SUCCESS                 = 0,
    OBJC_SYNC_NOT_OWNING_THREAD_ERROR = -1
};


#endif // __OBJC_SYNC_H_

~~~

.mm 文件

~~~objective-c
#include "objc-private.h"
#include "objc-sync.h"

//
// Allocate a lock only when needed.  Since few locks are needed at any point
// in time, keep them on a single list.
//


typedef struct SyncData {
    struct SyncData* nextData;//每个SyncData 也包含一个指向另一个SyncData的指针，你可以把每个SyncData结构体看作是链表中的一个元素
    id               object;//就是我们给@synchronized 传入的那个对象
    int              threadCount;  // number of THREADS using this block，这和个SyncDat对象中的锁会被一些线程使用或等待，threadCount 就是此时这些线程的数量，它很有用处，因为SyncData 结构体会被缓存，如果threadCount==0，就表示这个SyncData 可以被复用。
    recursive_mutex_t        mutex;// 跟object 关联在一起的锁
} SyncData;

typedef struct {
    SyncData *data;
    unsigned int lockCount;  // number of times THIS THREAD locked this block
} SyncCacheItem;

typedef struct SyncCache {
    unsigned int allocated;
    unsigned int used;
    SyncCacheItem list[0];
} SyncCache;

/*
  Fast cache: two fixed pthread keys store a single SyncCacheItem. 
  This avoids malloc of the SyncCache for threads that only synchronize 
  a single object at a time.
  SYNC_DATA_DIRECT_KEY  == SyncCacheItem.data
  SYNC_COUNT_DIRECT_KEY == SyncCacheItem.lockCount
 */

typedef struct {
    SyncData *data;//指向SyncData节点链表头部的指针
    spinlock_t lock;//防止多个线程对此列表做并发修改的锁

    char align[64 - sizeof (spinlock_t) - sizeof (SyncData *)];
} SyncList __attribute__((aligned(64)));
// aligned to put locks on separate cache lines

// Use multiple parallel lists to decrease contention among unrelated objects.
#define COUNT 16
#define HASH(obj) ((((uintptr_t)(obj)) >> 5) & (COUNT - 1))//通过定义一个哈希算法将传入对象映射到数组上的一个下标。这个哈希算法审核及的很巧妙，是将对象指针在内存的地址和转化为无符号整形并右移5位，再跟15，也就是和0xF 做按位与运算，这样结果就不会超出数组大小。
#define LOCK_FOR_OBJ(obj) sDataLists[HASH(obj)].lock//哈希出对象的数组下标，然后取出与这个元素对应的lock
#define LIST_FOR_OBJ(obj) sDataLists[HASH(obj)].data
static SyncList sDataLists[COUNT];//sDataLists的声明，一个SyncList结构体数组，大小为16
//看完上面就知道了@synchronized 如何将一个锁和你正在同步的对象关联起来


enum usage { ACQUIRE, RELEASE, CHECK };

static SyncCache *fetch_cache(BOOL create)
{
    _objc_pthread_data *data;
    
    data = _objc_fetch_pthread_data(create);
    if (!data) return NULL;

    if (!data->syncCache) {
        if (!create) {
            return NULL;
        } else {
            int count = 4;
            data->syncCache = (SyncCache *)
                calloc(1, sizeof(SyncCache) + count*sizeof(SyncCacheItem));
            data->syncCache->allocated = count;
        }
    }

    // Make sure there's at least one open slot in the list.
    if (data->syncCache->allocated == data->syncCache->used) {
        data->syncCache->allocated *= 2;
        data->syncCache = (SyncCache *)
            realloc(data->syncCache, sizeof(SyncCache) 
                    + data->syncCache->allocated * sizeof(SyncCacheItem));
    }

    return data->syncCache;
}


void _destroySyncCache(struct SyncCache *cache)
{
    if (cache) free(cache);
}


static SyncData* id2data(id object, enum usage why)
{
    spinlock_t *lockp = &LOCK_FOR_OBJ(object);
    SyncData **listp = &LIST_FOR_OBJ(object);
    SyncData* result = NULL;

#if SUPPORT_DIRECT_THREAD_KEYS
    // Check per-thread single-entry fast cache for matching object
    BOOL fastCacheOccupied = NO;
    SyncData *data = (SyncData *)tls_get_direct(SYNC_DATA_DIRECT_KEY);
    if (data) {
        fastCacheOccupied = YES;

        if (data->object == object) {
            // Found a match in fast cache.
            uintptr_t lockCount;

            result = data;
            lockCount = (uintptr_t)tls_get_direct(SYNC_COUNT_DIRECT_KEY);
            require_action_string(result->threadCount > 0, fastcache_done, 
                                  result = NULL, "id2data fastcache is buggy");
            require_action_string(lockCount > 0, fastcache_done, 
                                  result = NULL, "id2data fastcache is buggy");

            switch(why) {
            case ACQUIRE: {
                lockCount++;
                tls_set_direct(SYNC_COUNT_DIRECT_KEY, (void*)lockCount);
                break;
            }
            case RELEASE:
                lockCount--;
                tls_set_direct(SYNC_COUNT_DIRECT_KEY, (void*)lockCount);
                if (lockCount == 0) {
                    // remove from fast cache
                    tls_set_direct(SYNC_DATA_DIRECT_KEY, NULL);
                    // atomic because may collide with concurrent ACQUIRE
                    OSAtomicDecrement32Barrier(&result->threadCount);
                }
                break;
            case CHECK:
                // do nothing
                break;
            }

        fastcache_done:     
            return result;            
        }
    }
#endif

    // Check per-thread cache of already-owned locks for matching object
    SyncCache *cache = fetch_cache(NO);
    if (cache) {
        unsigned int i;
        for (i = 0; i < cache->used; i++) {
            SyncCacheItem *item = &cache->list[i];
            if (item->data->object != object) continue;

            // Found a match.
            result = item->data;
            require_action_string(result->threadCount > 0, cache_done, 
                                  result = NULL, "id2data cache is buggy");
            require_action_string(item->lockCount > 0, cache_done, 
                                  result = NULL, "id2data cache is buggy");
                
            switch(why) {
            case ACQUIRE:
                item->lockCount++;
                break;
            case RELEASE:
                item->lockCount--;
                if (item->lockCount == 0) {
                    // remove from per-thread cache
                    cache->list[i] = cache->list[--cache->used];
                    // atomic because may collide with concurrent ACQUIRE
                    OSAtomicDecrement32Barrier(&result->threadCount);
                }
                break;
            case CHECK:
                // do nothing
                break;
            }

        cache_done:
            return result;
        }
    }

    // Thread cache didn't find anything.
    // Walk in-use list looking for matching object
    // Spinlock prevents multiple threads from creating multiple 
    // locks for the same new object.
    // We could keep the nodes in some hash table if we find that there are
    // more than 20 or so distinct locks active, but we don't do that now.
    
    spinlock_lock(lockp);

    {
        SyncData* p;
        SyncData* firstUnused = NULL;
        for (p = *listp; p != NULL; p = p->nextData) {
            if ( p->object == object ) {
                result = p;
                // atomic because may collide with concurrent RELEASE
                OSAtomicIncrement32Barrier(&result->threadCount);
                goto done;
            }
            if ( (firstUnused == NULL) && (p->threadCount == 0) )
                firstUnused = p;
        }
    
        // no SyncData currently associated with object
        if ( (why == RELEASE) || (why == CHECK) )
            goto done;
    
        // an unused one was found, use it
        if ( firstUnused != NULL ) {
            result = firstUnused;
            result->object = object;
            result->threadCount = 1;
            goto done;
        }
    }
                            
    // malloc a new SyncData and add to list.
    // XXX calling malloc with a global lock held is bad practice,
    // might be worth releasing the lock, mallocing, and searching again.
    // But since we never free these guys we won't be stuck in malloc very often.
    result = (SyncData*)calloc(sizeof(SyncData), 1);
    result->object = object;
    result->threadCount = 1;
    recursive_mutex_init(&result->mutex);
    result->nextData = *listp;
    *listp = result;
    
 done:
    spinlock_unlock(lockp);
    if (result) {
        // Only new ACQUIRE should get here.
        // All RELEASE and CHECK and recursive ACQUIRE are 
        // handled by the per-thread caches above.
        
        require_string(result != NULL, really_done, "id2data is buggy");
        require_action_string(why == ACQUIRE, really_done, 
                              result = NULL, "id2data is buggy");
        require_action_string(result->object == object, really_done, 
                              result = NULL, "id2data is buggy");

#if SUPPORT_DIRECT_THREAD_KEYS
        if (!fastCacheOccupied) {
            // Save in fast thread cache
            tls_set_direct(SYNC_DATA_DIRECT_KEY, result);
            tls_set_direct(SYNC_COUNT_DIRECT_KEY, (void*)1);
        } else 
#endif
        {
            // Save in thread cache
            if (!cache) cache = fetch_cache(YES);
            cache->list[cache->used].data = result;
            cache->list[cache->used].lockCount = 1;
            cache->used++;
        }
    }

 really_done:
    return result;
}


BREAKPOINT_FUNCTION(
    void objc_sync_nil(void)
);


// Begin synchronizing on 'obj'. 
// Allocates recursive mutex associated with 'obj' if needed.
// Returns OBJC_SYNC_SUCCESS once lock is acquired.  
int objc_sync_enter(id obj)
{
    int result = OBJC_SYNC_SUCCESS;

    if (obj) {
        SyncData* data = id2data(obj, ACQUIRE);
        require_action_string(data != NULL, done, result = OBJC_SYNC_NOT_INITIALIZED, "id2data failed");
	
        result = recursive_mutex_lock(&data->mutex);
        require_noerr_string(result, done, "mutex_lock failed");
    } else {
        // @synchronized(nil) does nothing
        if (DebugNilSync) {
            _objc_inform("NIL SYNC DEBUG: @synchronized(nil); set a breakpoint on objc_sync_nil to debug");
        }
        objc_sync_nil();//如果传入的对象时nil，啥事也不干,可以通过符号断点调试objc_sync_nil
    }

done: 
    return result;
}


// End synchronizing on 'obj'. 
// Returns OBJC_SYNC_SUCCESS or OBJC_SYNC_NOT_OWNING_THREAD_ERROR
int objc_sync_exit(id obj)
{
    int result = OBJC_SYNC_SUCCESS;
    
    if (obj) {
        SyncData* data = id2data(obj, RELEASE); 
        require_action_string(data != NULL, done, result = OBJC_SYNC_NOT_OWNING_THREAD_ERROR, "id2data failed");
        
        result = recursive_mutex_unlock(&data->mutex);
        require_noerr_string(result, done, "mutex_unlock failed");
    } else {
        // @synchronized(nil) does nothing
      //如果传入的对象时nil，啥事也不干
    }
	
done:
    if ( result == RECURSIVE_MUTEX_NOT_LOCKED )
         result = OBJC_SYNC_NOT_OWNING_THREAD_ERROR;

    return result;
}

~~~





# 还有啥不明白的

1. #define HASH(obj) ((((uintptr_t)(obj)) >> 5) 这里为啥右移5位？？？
2. 传入对象中途变为nil了，怎么处理，还是没有在源码中找到印证

#  参考 

1.  [官方文档](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Multithreading/ThreadSafety/ThreadSafety.html#//apple_ref/doc/uid/10000057i-CH8-SW3)
2.  [@synchronized源码](https://opensource.apple.com/source/objc4/objc4-646/runtime/objc-sync.mm)
3.  [关于 @synchronized，这儿比你想知道的还要多](http://yulingtianxia.com/blog/2015/11/01/More-than-you-want-to-know-about-synchronized/)
4.  翻译自 [Ryan Kaplan](http://rykap.com/about/) 的 [More than you want to know about @synchronized](http://rykap.com/objective-c/2015/05/09/synchronized.html)





