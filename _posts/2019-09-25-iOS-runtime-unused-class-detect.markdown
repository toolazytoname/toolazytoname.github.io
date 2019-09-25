---

layout: post
title:  "iOS运行时检测无用类"
date:   2019-9-25 14:50:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS优化
  - 自制工具
---



# 使用场景

1. 检测无用类，可通过LinkMap结合Mach-O或者AppCode，都是通过静态检查无用代码，经常会有误判。
2. App迭代过程中，公司的产品往往有很多历史遗留不用的代码，代码还是有引用的，但是逻辑入口已经没有了。都可以通过这个方式检测出来。

# 缺点

当然这种方法也有缺点，必须对整个App的业务足够了解，检测之前，比如进过所有的页面才行，不然会有误报。

# 思路

思路来自戴明的课程，通过阅读 runtime 源码

~~~objective-c
#define RW_INITIALIZED (1<<29)

bool isInitialized() {

   return getMeta()->data()->flags & RW_INITIALIZED;
}
~~~

保存在元类的 class_rw_t 结构体的flags的信息里面，flag的1<<29位记录的就是这个类是否初始化了的信息。课程里只是提供了这么一个思路。

# 如何实现呢？

经过了一番苦思冥想，狗咬刺猬，无处下嘴啊。下班后回到家里，灵机一动。

`我可以自定义一个结构体，如果我自定义的 结构体和真实的objc_class一样，那么当我强制转换的时候，就会一一对应赋值。这样我就可以获取内部信息了，自然也就能知道这个isInitialized的返回值了`

毕竟C和C++都还给老师了，我写起来挺费劲的。主要参考[iOS底层原理总结 - 探寻Class的本质](https://www.jianshu.com/p/74db5638f34f) ,感谢谷歌。这一段代码存在结构他的集成，结构体内公用方法，应该是用Objective-C++编译的。放在.h里面，没搞定，就直接移到.mm里面了。

授人以渔，我也授人以鱼。[鱼](https://github.com/toolazytoname/FDKit/blob/master/FDKit/Classes/Utility/IsInitial/FDIsInitialDump.mm)在这里，自取。



~~~objective-c
/* 类对象 */
struct lazyFake_objc_class : lazyFake_objc_object {
    Class superclass;
    cache_t cache;
    class_data_bits_t bits;
public:
    class_rw_t* data() {
        return bits.data();
    }
    
    lazyFake_objc_class* metaClass() { //提供metaClass函数，获取元类对象
        //isa指针需要经过一次 &ISA_MASK操作之后才得到真正的地址
        return (lazyFake_objc_class *)((long long)isa & ISA_MASK);
    }
    bool isInitialized() {
        return metaClass()->data()->flags & RW_INITIALIZED;
    }
};
~~~


​	

最后在这个特别的日子，给自己加油。
