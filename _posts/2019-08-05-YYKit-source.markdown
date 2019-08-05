---

layout: post
title:  "YYKit源码阅读"
date:   2019-8-5 10:26:32 +0800
categories: iOS
catalog:  true
tags:
    - iOS
    - 编程技巧
    - 源码阅读

---



源码阅读系列 [YYKit]({{site.url}}/)





# 宏定义

## YYSYNTH_DUMMY_CLASS

~~~objective-c
/**
 Add this macro before each category implementation, so we don't have to use
 -all_load or -force_load to load object files from static libraries that only
 contain categories and no classes.
 More info: http://developer.apple.com/library/mac/#qa/qa2006/qa1490.html .
 *******************************************************************************
 Example:
     YYSYNTH_DUMMY_CLASS(NSString_YYAdd)
 */
#ifndef YYSYNTH_DUMMY_CLASS
#define YYSYNTH_DUMMY_CLASS(_name_) \
@interface YYSYNTH_DUMMY_CLASS_ ## _name_ : NSObject @end \
@implementation YYSYNTH_DUMMY_CLASS_ ## _name_ @end
#endif
~~~

有两个知识点
### 这个类的作用

这里有解释 [Building Objective-C static libraries with categories](https://developer.apple.com/library/archive/qa/qa1490/_index.html)这个宏定义的功能上面已经讲得很清楚了。在每个类别实现之前添加这个宏，这样我们就不必使用-all_load或-force_load来从只包含类别而不包含类的静态库加载对象文件。
在用第三方库、类或者静态库时，我们常常在Xcode的Build Settings下Other Linker Flags里面加入-ObjC标志。

原因：

Unix的标准静态库实现和Objective-C的动态特性之间有一些冲突：Objective-C没有为每个函数（或者方法）定义链接符号，它只为每个类创建链接符号。这样当在一个静态库中使用类别来扩展已有类的时候，链接器不知道如何把类原有的方法和类别中的方法整合起来，就会导致你调用类别中的方法时，出现"selector not recognized"，也就是找不到方法定义的错误。为了解决这个问题，引入了-ObjC标志，它的作用就是将静态库中所有的和对象相关的文件都加载进来。
不要以为这样就可以解决所有问题了，在64位的Mac系统或者iOS系统下，链接器有一个bug，会导致只包含有类别的静态库无法使用-ObjC标志来加载文件。变通方法是使用-all_load 或者-force_load标志，它们的作用都是加载静态库中所有文件，不过all_load作用于所有的库，而-force_load后面必须要指定具体的文件他们加载的位置也是在Xcode的Build Settings下Other Linker Flags里面。
所以一般加了这两个的都是存在一些扩展类。
只要加入了这个宏定义我们就不需要在添加这两个方法了。

###  宏中"#"和"##"的用法

使用#把宏参数变为一个字符串,用##把两个宏参数贴合在一起.

## do...while(0)
~~~objective-c
#ifndef YY_SWAP // swap two value
#define YY_SWAP(_a_, _b_)  do { __typeof__(_a_) _tmp_ = (_a_); (_a_) = (_b_); (_b_) = _tmp_; } while (0)
#endif
~~~

我很好奇这里的do... while (0),岂不是多次一举嘛搜索了一下[do...while(0)的妙用](https://www.cnblogs.com/flying_bat/archive/2008/01/18/1044693.html)

简单列举一下

粗看我们就会觉得很奇怪，既然循环里面只执行了一次，我要这个看似多余的do...while(0)有什么意义呢？ 
当然有！
为了看起来更清晰，这里用一个简单点的宏来演示：

```c
#define SAFE_DELETE(p) do{ delete p; p = NULL} while(0)
// 假设这里去掉do...while(0),
#define SAFE_DELETE(p) delete p; p = NULL;
//那么以下代码：
if(NULL != p) SAFE_DELETE(p)
else   ...do sth...

```

  就有两个问题，

1. 因为if分支后有两个语句，else分支没有对应的if，编译失败
2. 假设没有else, SAFE_DELETE中的第二个语句无论if测试是否通过，会永远执行。

当然内心可能有别的想法

1. 直接用{}括起来就可以了
   #define SAFE_DELETE(p) { delete p; p = NULL;}
   的确，这样的话上面的问题是不存在了，但是我想对于C++程序员来讲，在每个语句后面加分号是一种约定俗成的习惯，这样的话，以下代码:
   if(NULL != p) SAFE_DELETE(p);
   else   ...do sth...
   其else分支就无法通过编译了（原因同上），所以采用do...while(0)是做好的选择了。

2. 也许你会说，我们代码的习惯是在每个判断后面加上{}, 就不会有这种问题了，也就不需要do...while了，如：
   if(...) 
   {
   }
   else
   {
   }
   诚然，这是一个好的，应该提倡的编程习惯，但一般这样的宏都是作为library的一部分出现的，而对于一个library的作者，他所要做的就是让其库具有通用性，强壮性，因此他不能有任何对库的使用者的假设，如其编码规范，技术水平等。 

以上摘抄自参考文章，另外还列举了一个do...while(0)，在程序结构层面的妙用

**version 1**



~~~c
bool Execute()
{
   // 分配资源
   int *p = new int;
   bool bOk(true);

   // 执行并进行错误处理
   bOk = func1();
   if(!bOk) 
   {
      delete p;   
      p = NULL;
      return false;
   }

   bOk = func2();
   if(!bOk) 
   {
      delete p;   
      p = NULL;
      return false;
   }

   bOk = func3();
   if(!bOk) 
   {
      delete p;   
      p = NULL;
      return false;
   }

   // ..........

   // 执行成功，释放资源并返回
    delete p;   
    p = NULL;
    return true;
   
}

~~~


这里一个最大的问题就是代码的冗余，而且我每增加一个操作，就需要做相应的错误处理，非常不灵活。于是我们想到了goto:

**version 2**

~~~c
bool Execute()
{
   // 分配资源
   int *p = new int;
   bool bOk(true);

   // 执行并进行错误处理
   bOk = func1();
   if(!bOk) goto errorhandle;

   bOk = func2();
   if(!bOk) goto errorhandle;

   bOk = func3();
   if(!bOk) goto errorhandle;

   // ..........

   // 执行成功，释放资源并返回
    delete p;   
    p = NULL;
    return true;

errorhandle:
    delete p;   
    p = NULL;
    return false;
   
}
~~~

代码冗余是消除了，但是我们引入了C++中身份比较微妙的goto语句，虽然正确的使用goto可以大大提高程序的灵活性与简洁性，但太灵活的东西往往是很危险的，它会让我们的程序捉摸不定，那么怎么才能避免使用goto语句，又能消除代码冗余呢，请看do...while(0)循环：



**version3**



~~~c
bool Execute()
{
   // 分配资源
   int *p = new int;

   bool bOk(true);
   do
   {
      // 执行并进行错误处理
      bOk = func1();
      if(!bOk) break;

      bOk = func2();
      if(!bOk) break;

      bOk = func3();
      if(!bOk) break;

      // ..........

   }while(0);

    // 释放资源
    delete p;   
    p = NULL;
    return bOk;

}


~~~


“漂亮！”， 看代码就行了，啥都不用说了...


# 参考

1.  [YYKit]( https://github.com/ibireme/YYKit)
2.   [Building Objective-C static libraries with categories](https://developer.apple.com/library/archive/qa/qa1490/_index.html)
3.  [do...while(0)的妙用](https://www.cnblogs.com/flying_bat/archive/2008/01/18/1044693.html)

   

