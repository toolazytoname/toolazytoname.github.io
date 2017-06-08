---
layout: post
title:  "MDK3 Documentation翻译"
date:   2017-05-26 11:55:32 +0800
categories: hack your life
catalog:  true
tags:
  - hack your life
---


英文原文：[MDK3 Documentation](https://svn.mdk3.aircrack-ng.org/mdk3/docs/Documentation_incomplete.html)

译前备注：因为对很多相关知识内容不太理解，强心翻译觉得意义不大，所以先放着。


MDK这个工具将IEEE 802.11这个协议的脆弱淋漓尽致地展现在人们面前。
请确保无线网络的所有者同意你用MDK攻击攻击他的网络，你将为此承担全部责任。

MDK3是一个Wi-Fi测试工具，源于k2wrlz的ASPj项目。它使用aircrack-ng项目的osdep库，可以在某几个操作系统上注入数据帧。这个工具的很多部分都是由伟大的aircrack-ng社区贡献完成的，他们是：Antragon, moongray, Ace, Zero_Chaos, Hirte, thefkboss, ducttape, telek0miker, Le_Vert, sorbo, Andy Green, bahathir, Dawid Gajownik and Ruslan Nabioullin.
谢谢你们。

MDK3基于GPL协议。

文章的内容如下：

1. 搭建你的测试环境
2. 让MDK3跑起来（编译MDK3）
3. 如何使用MDK3
4. 不同的测试模式


# 1.搭建你的测试环境

MDK3是一个往无线网络”注入“数据的工具。所谓“注入”，就是在未建立连接的前提下，能够凭空把自己创造的数据发送给某个网络或者某个站点。MDK3可以用来发送一些本该由无线网络管理者发送的数据包来混淆视听，这些包本不该由一个普通的接入者来发送。这是注入技术的唯一的实现方式。不幸的是，一开始WiFi设备并不是以此为目的被被创造出来的！所以，要想让注入功能在未来的无线网卡上能正常使用，你必须在驱动程序上做一些修改。有几个黑客（包括我自己）已经做了很多工作，目前经过我们修改的驱动程序已经适配了很多硬件设备。在不久的将来，Linux 核心支持的无线网络子系统 [mac80211](!http://linuxwireless.org/)将会被释出用来支持很多驱动和网卡。

如果想要安装支持注入的驱动，请访问[www.aircrack-ng.org](http://www.aircrack-ng.org/)或者关注[Driver Documentation](http://www.aircrack-ng.org/doku.php?id=compatibility_drivers)。
MDK3 所使用的驱动和注入的方式都是基于这个工程或者这个工程的早期版本。因此，列着的所有驱动应该都是可以喝MDK3配套使用的。（有一些个别的型号例如英特尔的Intel Centrino (ipw2200)不能被完全支持，因为它职能注入数据，但是没有任何管理信息！）。
MDK3 能在 Linux 上正常运行，当前的FreeBSD应该也没问题。Windows上也能跑，但你需要特别并且昂贵的硬件设备，否则在这个平台上MDK3和aircrack-ng都是完全不被支持的。MDK3最好是在在最新的Linux 内核和驱动上运行。用在aircrack-ng Wiki页面上推荐的驱动和补丁[compat-wireless](http://www.aircrack-ng.org/doku.php?id=compat-wireless)。


# 2.让MDK3跑起来（编译MDK3）

在一些Linux的发行版上已经预装了MDK3。有时候这些预装的软件版本已经比较老了，并且有很多bug。因为版本迭代的速度很快，会有很多bug会被修复，也会有很多新的功能点，所以建议你你最好经常更新到最新版本。
如果你想要编译mdk3，只要到你到解压tarballs包的目录下，直接在命令行输入make就可以了。
然后把编译完成的二进制文件拷贝到/usr/local/sbin目录下（安装），然后在命令行make install afterwards。
MDK3会用到libpthread 和 libpcap。你的设备上可能没有安pcap，可以用你的包管理软件去安装pcap（打个比方：在SuSE系统上用zypper in libpcap-devel，在Debian／Debian上用apt-get install libpcap-dev）。


# 3.如何使用MDK3
MDK3用起来特别简单，它自带很多帮助信息。
直接输入mdk3就可以看到一些主要信息的见解，如果想要看更加详细的所有选项介绍，输入mdk3 --fullhelp。
如果想看某一种模式的简介。输入mdk3 --help后面跟测试模式标识（(b, a, p, d, m, x, w, f 或者 g）。
在你使用MDK3之前，你应该先安装好无线网络适配器。目前有很多不同架构的驱动，你使用的驱动决定你安装适配器的方式。如果你想要整个过程顺畅舒心一点，还是建议你使用aircrack 工程的airmon-ng，几乎所有的驱动它都能直接搞定。
看一下这篇[documentation for airmon-ng ](http://www.aircrack-ng.org/doku.php?id=airmon-ng)你会学习到如何设置网卡到不同的模式（有的时候需要调到监听模式）。

充要提示：你必须吧你的设备调到你的目标 接入点／客户端 所在的频道，不然会不管用，这是常见的一个错误。
建议你用airodump-ng来寻找周围的接入点和客户端。只要输入airodump-ng [your_interface] 就可以看到周边可用站点。如果你打算在某一个频道上面测试，你必须重启airodump然后设置一下频道号，这样你的网卡就不会改变频道去寻找别的站点了。这些你都可以用airodump-ng -c [channel] [your_interface] 这个命令来实现。用airodump-ng的好处是你不用操心如何正确设置你的网卡airmon-ng 和 airodump-ng都已经帮你做了。

硬件已经设置好了，接下里你可以开始使用MDK3。
还有一个重要的提示要给到专业的人士：某些驱动不会正确的反馈给系统正确的注入数据帧，这样你在注入的接口上就不能同时嗅探你自己的注入数据包。那怎么才能知道自己的数据帧被正确地发送了呢？在同一个频道上安装另一个接口，就可以用嗅探到你自己的网络帧了。你可以用aireplay-ng的诸如测试模式来查看是否一切正常。

# 4.不同的测试模式

b - 灯塔洪水

无线接入点为了标识每秒大概会发出10个灯塔帧。在扫描无线网络的时候，你的网卡其实是在寻找每个频道的灯塔帧。MDK3也可以发送这些灯塔帧。因此只要你愿意，你想创建多少无线网络就可以创建多少无线网络。但记住，你建的这些都是假的，没有人能真的连接上它们。人们可以在他们的无线网络设备上看到它们。Windows系统制药没有连接上，就会一直自动扫描获取信息。还有一点，可以通过这个模式生成成千上万个同名假网络来隐藏一个真的网络。这个模式有几个设置选项，通过设置网络名称，加密方式，速度等。继续读下去去熟悉这些：

* -n  \<ssid>
	* 用SSID<ssid>代替随机生成的名字。
	* 这个选项是用来设置网络名称的。通过这种方式设置的名字都是假的。可以用来隐藏真实网络。
* -f \<filename>
	* 从文件读取SSID。
	* 这个选项可以让你从文件名读取网络名称。这种方式能让你一下子创建好几个假的网络。
* -v \<filename>
	* 从文件读取物理地址和SSID。参看例子文件。
	* 这个参数用来虚拟某些特别的网络。文件内容的每一行都有物理地址和名称。参看例子文件fakeap-example.txt就明白如何使用了。
* -t \<adhoc> 
	* -t 1=创建点对点网络
	* -t 0=创建可管理的（AP）网络
	* 如果没有设置这个选项，两种类型的网络都会被创建。
	* 选择用来虚拟一个真实的网络或者一个只有客户端的点对点网络（没有接入点的网络，点对点直接通信），或者两者都创建。
* -w \<encryptions> 
	* 所创建假网络的加密方式	 
	* 有效的参数:n=不加密，w=WEP，t=TKIP（WPA），a=AES(WPA2)
	* 可以选择多个类型，比如"-w wta"会创建WEP类型的和WPA类型的网络。
* -b \<bitrate>	
	* 选择 11Mbit(b)或者54MBit(g)网络
	* 如果没有这个选项，两种类型的都会被创建
* -m \<bitrate>
	* 从内建的OUI数据库读取有效的MAC地址
	*  一般来说，MDK3创建的网络地址都是随机地址。这些随机生成的物理地址都会被真的设备所使用，这样就很容易被识别出来是假的。
	*  这个选项关联到MDK3内建的地址数据库，这些数据都是已知硬件设备的真实数据。带上这个参数，是这是假就没那么容易分辨了。
* - h 
	*  

	

	


