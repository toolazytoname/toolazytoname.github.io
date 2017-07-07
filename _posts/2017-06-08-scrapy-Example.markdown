---
layout: post
title:  "美女网站爬虫入坑"
date:   2017-06-08 08:58:32 +0800
categories: python
catalog:  false
tags:
  - python 爬虫
---


# 1 缘起

在很久很久以前，就想接触一下爬虫，翻到余弦大大的这篇文章，[写爬虫很简单但也很难(附某美女站爬虫源码)](http://mp.weixin.qq.com/s/yRsH0mgcWkqQwJcCL9VnmA) 我知道，是时候了。[修改后能跑的代码](https://github.com/toolazytoname/crawlers)

# 2 坑

踩了这么几个坑

* Mac上安装Scrapy的，一开始没仔细看安装文档https://doc.scrapy.org/en/latest/intro/install.html，直接pip install Scrapy，谁知道mac自带的系统python有问题，折腾了半天才知道在文档的后面有关于这个的介绍，于是按照文档推荐的方式重新安装python，并且修改了PATH内路径的顺序。
* 安装好以后，直接git clone 源代码，也不知道是为啥。没有图片下下来啊，于是我就开始翻官方的文档。主要是通过以下几种方式调试
    * 为了减少日志输出，先把next 翻页的代码注释掉
    * 根据理解的数据流程一步一步打日志，发现我把tu.68flash.com 改成http:// 就可以了，改好以后就开始飕飕地下图片

# 3 理解与修改

所谓简单粗暴，我的理解是，通过超链接，跳到所有的页面，然后把图片的src给下下来，不知道理解的是否深刻。这里其实还是有优化的余地，例如样张里面的大图，都下不下来。因为这个超链接直接指向jpg，这个规则就失效了，所以我做了一下优化。可以看Git提交记录。

* 加了这句话 il.add_css('image_urls', 'a::attr(href)’)
* 同时把DEPTH_LIMIT = 2 给注释了
* 也可以给图片加个大小的限制，接个过滤。
* 改了文件目录，之前的那个目录需要sudo
    * 难道目录不能出现～
    * 目录后面的／不要忘了

    
至此我感受到的是深深的敬畏。
遗憾的是，所谓的会员部分的小技巧，没有在源码中体现。希望随着自己的进步以后能够领悟到。入坑完毕。

在4chan 上也试了一把，太可怕了。

# 4 Next steps

1. [scrapy](https://doc.scrapy.org/en/latest/index.html)
2. [知乎爬虫索引](https://www.zhihu.com/topic/19577498)
3. [Dive Into Python 3](http://www.diveintopython3.net)
4. [The Python Tutorial](https://docs.python.org/3/tutorial/)
5. [【干货】高级架构师实战：如何用最小的代价完成爬虫需求 (岂安低调分享) ](https://mp.weixin.qq.com/s/8F8jDf59zLx_vI_88ONCIw)
6. [航空公司与爬虫的战争：特价票的真相与内幕 | 岂安低调分享](https://mp.weixin.qq.com/s?__biz=MzIxNDE4MzA4OQ==&mid=2651025755&idx=1&sn=f42dee60ec66510ca2575301d9611b49&chksm=8c5cac85bb2b2593996258241a96a6448eb2c1682d300b6d02f068936171e202deab86c16db1&scene=21#wechat_redirect)
7. [一篇文章了解爬虫技术现状 | 岂安低调分享](https://mp.weixin.qq.com/s/N95afABrhlajeHlxMxZMsg)
5. [别让你的老板进监狱也别让你的用户受伤害，谈爬虫反爬虫套路](https://mp.weixin.qq.com/s/tdt0TQtGpiT_LcHkTXLa7A)

	

	


