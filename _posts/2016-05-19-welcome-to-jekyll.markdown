---
layout: post
title:  "Jekyll +  GitHub Pages建站流程"
date:   2016-05-19 17:27:32 +0800
categories: hack your life
tags:
  - hack your life
---

网上有些教程写得很细，比如[how-to-build-a-blog](http://cnfeat.com/blog/2014/05/10/how-to-build-a-blog/) 和[build-github-blog-page-08](http://www.pchou.info/ssgithubPage/2014-07-04-build-github-blog-page-08.html)

* 配置参考[pages.github](https://pages.github.com)。搞定了可以直接访问 http://username.github.io.
    * GitHub 的配置。
    * Jekyll的配置
* 购买域名，我在[godaddy](https://www.godaddy.com)买了一年，花了8元。
* 域名服务设置，发现godaddy 也可以提供相应的服务，就直接在godaddy上面设置了




TODO

* <del>主题比较简单，不太好看。但是我看Jekyll 文档里面主题相关的设置还没有release，手工配置起来不太优雅。另外还没定一个的原因是，太多了，挑花眼了。<del>
* <del>404<del>
* Roberts协议
* 评论系统，还挺巧，多说过两天就关闭了。Disqus配上了不管用，貌似被墙了。



更新于2017年5月19日，还挺巧，整好差不多一年了。

原来的域名到期了，虽然还是能用，但我还是替换了一个更加逗逼的域名😄，又重温了一边上面的各种文档，配置了一下DNS解析。

| 记录类型  | 主机记录  | 记录值 |
|:------------- |:---------------:| -------------:|
| A      | @ |         192.30.252.153 |
| A      | @        |   192.30.252.154 |
| CNAME | www        |   toolazytoname.github.io. |

找了个主题换上，各方面还是比较满意的。各方面该有的功能也都有。UI配色各方面都不错，右边栏能自动生成导航栏。


2018年2月23日更新，重新更新到了稳定版
复制自己已经编辑的内容，包括


* _posts：markdown都在里面
* assets：文章中引用的一些资源
* img：换了自己的头像logo 啥的，以后把post中的图片放到img/in-post/下面
* _config.yml：自己的一些配置参数
* about.html：个人介绍
* CNAME：自己申请的一个逗逼域名
* index.html ：编辑一下首页副标题


disqus调试了半天，本地运行是可以显示，奇怪怎么线上显示不了呢。调试过程中学了一招

~~~
//用这种方式可以看变量值
{{ variable | inspect }}
~~~
过段时间再看看吧








