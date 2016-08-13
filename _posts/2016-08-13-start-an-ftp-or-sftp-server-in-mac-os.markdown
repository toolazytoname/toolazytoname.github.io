---
layout: post
title:  "Mac上搭建FTP&SFTP服务"
date:   2016-08-13 21:53:32 +0800
categories: hack your life
---


**目录**

1. [ 为什么会想要搭建一个FTP服务器](#why)
2. [ Start the FTP Server](#FTP)
3. [ Enabling the SFTP Server](#SFTP)
4. [ Disable FTP or SFTP Server](#disable)
5. [Reference](#reference)


1 为什么会想要搭建一个FTP服务器<a name="why"></a>
===

电脑的硬盘里面有些刚下的高清电影，有的时候在iPad上看，拷到设备上看太low了，于是就打算搭建一个服务器，然后在手机上就用带FTP功能的视频客户端去访问就可以了。目前来看，这套方案体验还是不错的。
[知乎](https://www.zhihu.com/question/20581392)上还有人专门问过这个问题。


我的方案是 Mac（FTP）＋iOS（nPlayer）。期待用上自己做的播放器客户端。


2 Start the FTP Server<a name="FTP"></a>
===
直接使用终端输入这行命令即可。

~~~
sudo -s launchctl load -w /System/Library/LaunchDaemons/ftp.plist
~~~

还可以用试着登录一下。

~~~
ftp localhost
~~~


3 Enabling the SFTP Server <a name="SFTP"></a>
===

出于安全考虑，用SFTP也很简单。如下图，只要进设置共享页面，打开远程登录就可以了，勾选了之后，就打开了SSH和SFTP。

![Code Shot]({{ site.url }}/assets/snip20160813_0.png)



打开以后，也可以用以下命令跑一下试试。

~~~
sftp localhost 
~~~

4 Disable FTP or SFTP Server <a name="disable"></a>
===


~~~
sudo -s launchctl unload -w /System/Library/LaunchDaemons/ftp.plist
~~~

运行了这个命令以后，FTP的守护进程（FTP deamon）(总有一种守护天使的即视感，觉得翻译的挺好)就会停止，FTP 服务也就终止了。

怎么开，怎么关，只要在设置共享页面中远程登录的勾选给取消了，就关闭了SFTP。



5 Reference<a name="reference"></a>
===

完全参考这篇

- [Start an FTP or SFTP Server in Mac OS X](http://osxdaily.com/2011/09/29/start-an-ftp-or-sftp-server-in-mac-os-x-lion/
)


