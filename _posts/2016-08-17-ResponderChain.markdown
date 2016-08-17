---
layout: post
title:  "ResponderChain 刨根问底"
date:   2016-08-17 14:58:32 +0800
categories: 心路
---

一直以为以为对于手势，自己还是比较了解的，谁知道干起活来，也会有卡壳的时候。所以记录一下。

**目录**

* [遇到的问题](#question)
	* [问题一：在动画中不响应手势](#question1)
	* [问题一的解决思路](#solve1)
	* [问题二 :点击事件的传递](#questiion2)
	* [问题二的解决思路](#solve2)
* [收获](#harvest)
	* [工具](#tool)
	* [概念](#konwledge)
* [Reference](#reference)


遇到的问题<a name="question"></a>
===


问题一：在动画中不响应手势<a name="question1"></a>
----

因为我想要在弹幕上面加手势，弹幕本身是有一个animation，加上去以后，发现手势不响应。


问题一的解决思路<a name="solve1"></a>
----


放狗搜了一下，有人碰到了同样的问题,需要加一个参数UIViewAnimationOptionAllowUserInteraction 才可以。
不知道CABasicAnimation的方式，该怎么加上这个参数，所以将原先的实现方式改成 UIView block 的形式，不管用。

继续搜索
[UIViewAnimationOptionAllowUserInteraction not working](http://stackoverflow.com/questions/9523981/uiviewanimationoptionallowuserinteraction-not-working)

~~~
The reason the interactions are not working is that essentially the UIImageView is not where it appears to be. Only the view's CALayer's presentation layer is being animated around the screen. The view has already arrived at it's destination immediately. This makes interaction much harder. You will likely find this answer helpful.
~~~

[UIButton can't be touched while animated with UIView animateWithDuration](http://stackoverflow.com/questions/8346100/uibutton-cant-be-touched-while-animated-with-uiview-animatewithduration/8346178#8346178)
原来UIViewAnimationOptionAllowUserInteraction 这个参数，只能在final value from your animation位置触发。中间态还是无效的。
这篇文章的方法是，直接在对应的controller里面加上这段代码

~~~
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
    UITouch *touch = [touches anyObject];
    CGPoint touchLocation = [touch locationInView:self.view];
    for (UIButton *button in self.buttonsOutletCollection)
    {
        if ([button.layer.presentationLayer hitTest:touchLocation])
        {
            // This button was hit whilst moving - do something with it here
            break;
        }
    }
}
~~~


但是我的解决方案是，在我的弹幕view 的父亲view上加上手势，这样也会拦截到点击事件。





问题二 :点击事件的传递<a name="questiion2"></a>
----
假设
view 的层级如此，A上C上，都加了Tap手势。有的时候，我想要在C上面响应，不想让Tap事件传到A上，有的时候，又想让C直接处理了。

~~~
+----------------------------+
|A                           |
|+--------+   +------------+ |
||B       |   |C           | |
||        |   |+----------+| |
|+--------+   ||D         || |
|             |+----------+| |
|             +------------+ |
+----------------------------+
~~~


另外一个场景是，两个view，完全重叠，兄弟关系，想让下面的那个view
响应，下面的view 完全不在响应者链上。
如下图所示

图片来自这篇文章[Hacking the responder chain](http://bynomial.com/blog/?p=74)
![exmaple view hierarchy]({{ site.url }}/assets/snip20160817_0_exmaple_view_hierarchy.png)



问题二的解决思路<a name="solve2"></a>
----


如果是顺着原来的响应者链，可以用这种方式，去做一个拦截或者往下传的操作，相当于一个大坝，可以开闸泄洪，也可以蓄流。

~~~
/**
 *  只有在弹幕点击区域，才return Yes，否则return NO。这样才能不影响tap事件向下传递到下层，去做呼起操控栏的操作
 *
 */
- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
~~~



如果想要响应的view，不在当前的响应者链上，那么可以通过这种方式，改道。相当于，自己挖一条人工河，做一个引流。
这篇文章写得很好。[Hacking the responder chain](http://bynomial.com/blog/?p=74)



收获<a name="harvest"></a>
====

工具<a name="tool"></a>
-----


写了一个工具，可以检测当前点击事件的hitTest链和响应者链。网上没有现成了，自己写了一个，顺便自己实现了一遍hitTest方法。挺有成就感的。

[FDResponderChainDebug](
https://github.com/toolazytoname/FDResponderChainDebug)

概念<a name="konwledge"></a>
----

熟悉各个view层级间的，hitTest 方法和pointInside方法的调用顺序，可以reset 到这个提交节点098a6ea82a6b66e12c433e83642d802231712045，观察。
对应的view 层级为

![hit test depth first traversal]({{ site.url }}/assets/snip20160817_1_hit-test-depth-first-traversal.png)




输出结果

~~~
2016-08-17 09:52:21.414 FDDebugWindowDemo[291:13552] func:-[FDLogView pointInside:withEvent:];self:<FDLogView: 0x1006350c0; frame = (0 0; 1024 1366); autoresize = W+H; tag = 1; layer = <CALayer: 0x100633ed0>>;isInside:1
2016-08-17 09:52:21.415 FDDebugWindowDemo[291:13552] func:-[FDLogView pointInside:withEvent:];self:<FDLogView: 0x100635770; frame = (36 28; 544 552); autoresize = RM+BM; tag = 2; layer = <CALayer: 0x100633e70>>;isInside:1
2016-08-17 09:52:21.416 FDDebugWindowDemo[291:13552] func:-[FDLogView pointInside:withEvent:];self:<FDLogView: 0x100636580; frame = (31 415; 500 108); autoresize = RM+BM; tag = 33; layer = <CALayer: 0x10061b410>>;isInside:0
2016-08-17 09:52:21.416 FDDebugWindowDemo[291:13552] func:-[FDLogView hitTest:withEvent:];self:<FDLogView: 0x100636580; frame = (31 415; 500 108); autoresize = RM+BM; tag = 33; layer = <CALayer: 0x10061b410>>;hitTstView:(null)
2016-08-17 09:52:21.416 FDDebugWindowDemo[291:13552] func:-[FDLogView pointInside:withEvent:];self:<FDLogView: 0x100636c10; frame = (173 185; 196 210); autoresize = RM+BM; tag = 32; layer = <CALayer: 0x100634220>>;isInside:1
2016-08-17 09:52:21.420 FDDebugWindowDemo[291:13552] func:-[FDLogView pointInside:withEvent:];self:<FDLogView: 0x100636fa0; frame = (11 114; 149 88); autoresize = RM+BM; tag = 44; layer = <CALayer: 0x100637110>>;isInside:0
2016-08-17 09:52:21.420 FDDebugWindowDemo[291:13552] func:-[FDLogView pointInside:withEvent:];self:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>;isInside:1
2016-08-17 09:52:21.421 FDDebugWindowDemo[291:13552] func:-[FDLogView hitTest:withEvent:];self:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>;hitTstView:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>
2016-08-17 09:52:21.424 FDDebugWindowDemo[291:13552] func:-[FDLogView hitTest:withEvent:];self:<FDLogView: 0x100636c10; frame = (173 185; 196 210); autoresize = RM+BM; tag = 32; layer = <CALayer: 0x100634220>>;hitTstView:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>
2016-08-17 09:52:21.425 FDDebugWindowDemo[291:13552] func:-[FDLogView hitTest:withEvent:];self:<FDLogView: 0x100635770; frame = (36 28; 544 552); autoresize = RM+BM; tag = 2; layer = <CALayer: 0x100633e70>>;hitTstView:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>
2016-08-17 09:52:21.425 FDDebugWindowDemo[291:13552] func:-[FDLogView hitTest:withEvent:];self:<FDLogView: 0x1006350c0; frame = (0 0; 1024 1366); autoresize = W+H; tag = 1; layer = <CALayer: 0x100633ed0>>;hitTstView:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>
2016-08-17 09:52:21.428 FDDebugWindowDemo[291:13552] func:-[FDLogView pointInside:withEvent:];self:<FDLogView: 0x1006350c0; frame = (0 0; 1024 1366); autoresize = W+H; tag = 1; layer = <CALayer: 0x100633ed0>>;isInside:1
2016-08-17 09:52:21.433 FDDebugWindowDemo[291:13552] func:-[FDLogView pointInside:withEvent:];self:<FDLogView: 0x100635770; frame = (36 28; 544 552); autoresize = RM+BM; tag = 2; layer = <CALayer: 0x100633e70>>;isInside:1
2016-08-17 09:52:21.434 FDDebugWindowDemo[291:13552] func:-[FDLogView pointInside:withEvent:];self:<FDLogView: 0x100636c10; frame = (173 185; 196 210); autoresize = RM+BM; tag = 32; layer = <CALayer: 0x100634220>>;isInside:1
2016-08-17 09:52:21.439 FDDebugWindowDemo[291:13552] func:-[FDLogView pointInside:withEvent:];self:<FDLogView: 0x100636fa0; frame = (11 114; 149 88); autoresize = RM+BM; tag = 44; layer = <CALayer: 0x100637110>>;isInside:0
2016-08-17 09:52:21.440 FDDebugWindowDemo[291:13552] func:-[FDLogView hitTest:withEvent:];self:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>;hitTstView:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>
2016-08-17 09:52:21.443 FDDebugWindowDemo[291:13552] func:-[FDLogView hitTest:withEvent:];self:<FDLogView: 0x100636c10; frame = (173 185; 196 210); autoresize = RM+BM; tag = 32; layer = <CALayer: 0x100634220>>;hitTstView:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>
2016-08-17 09:52:21.444 FDDebugWindowDemo[291:13552] func:-[FDLogView hitTest:withEvent:];self:<FDLogView: 0x100635770; frame = (36 28; 544 552); autoresize = RM+BM; tag = 2; layer = <CALayer: 0x100633e70>>;hitTstView:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>
2016-08-17 09:52:21.444 FDDebugWindowDemo[291:13552] func:-[FDLogView hitTest:withEvent:];self:<FDLogView: 0x1006350c0; frame = (0 0; 1024 1366); autoresize = W+H; tag = 1; layer = <CALayer: 0x100633ed0>>;hitTstView:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>
2016-08-17 09:52:21.446 FDDebugWindowDemo[291:13552] func:-[ViewController gestureRecognizer:shouldReceiveTouch:];self:<ViewController: 0x10014d020>;
2016-08-17 09:52:21.452 FDDebugWindowDemo[291:13552] func:-[FDLogView touchesBegan:withEvent:];self:<FDLogView: 0x1006350c0; frame = (0 0; 1024 1366); autoresize = W+H; tag = 1; layer = <CALayer: 0x100633ed0>>;
2016-08-17 09:52:21.452 FDDebugWindowDemo[291:13552] func:-[FDLogView touchesBegan:withEvent:];self:<FDLogView: 0x100635770; frame = (36 28; 544 552); autoresize = RM+BM; tag = 2; layer = <CALayer: 0x100633e70>>;
2016-08-17 09:52:21.453 FDDebugWindowDemo[291:13552] func:-[FDLogView touchesBegan:withEvent:];self:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>;
2016-08-17 09:52:21.476 FDDebugWindowDemo[291:13552] func:-[ViewController gestureRecognizerShouldBegin:];self:<ViewController: 0x10014d020>;
2016-08-17 09:52:21.477 FDDebugWindowDemo[291:13552] func:-[ViewController handleTapGesture:];self:<ViewController: 0x10014d020>;tapGestureRecognizer:<UITapGestureRecognizer: 0x100634470; state = Ended; view = <FDLogView 0x100636d80>; target= <(action=handleTapGesture:, target=<ViewController 0x10014d020>)>>
2016-08-17 09:52:21.477 FDDebugWindowDemo[291:13552] func:-[FDLogView touchesCancelled:withEvent:];self:<FDLogView: 0x1006350c0; frame = (0 0; 1024 1366); autoresize = W+H; tag = 1; layer = <CALayer: 0x100633ed0>>;
2016-08-17 09:52:21.478 FDDebugWindowDemo[291:13552] func:-[FDLogView touchesCancelled:withEvent:];self:<FDLogView: 0x100635770; frame = (36 28; 544 552); autoresize = RM+BM; tag = 2; layer = <CALayer: 0x100633e70>>;
2016-08-17 09:52:21.478 FDDebugWindowDemo[291:13552] func:-[FDLogView touchesCancelled:withEvent:];self:<FDLogView: 0x100636c10; frame = (173 185; 196 210); autoresize = RM+BM; tag = 32; layer = <CALayer: 0x100634220>>;
2016-08-17 09:52:21.478 FDDebugWindowDemo[291:13552] func:-[FDLogView touchesCancelled:withEvent:];self:<FDLogView: 0x100636d80; frame = (8 25; 154 81); autoresize = RM+BM; tag = 43; gestureRecognizers = <NSArray: 0x100621960>; layer = <CALayer: 0x100636b90>>;
~~~

Reference
===

没啥原创的东西，唯一自己实现的小工具，思想也是网上现成的。所以要感谢下面的文章。🙏

- [hit-testing-in-ios](http://smnh.me/hit-testing-in-ios/)
- [Event handling for iOS - how hitTest:withEvent: and pointInside:withEvent: are related?](http://stackoverflow.com/questions/4961386/event-handling-for-ios-how-hittestwithevent-and-pointinsidewithevent-are-r)
- [iOS事件机制(一)](http://ryantang.me/blog/2013/12/07/ios-event-dispatch-1/)
- [Hacking the responder chain](http://bynomial.com/blog/?p=74)
- [UIButton can't be touched while animated with UIView animateWithDuration](http://stackoverflow.com/questions/8346100/uibutton-cant-be-touched-while-animated-with-uiview-animatewithduration/8346178#8346178)
- [iOS Events and Responder Chain](https://www.zybuluo.com/MicroCai/note/66142)


