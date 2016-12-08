---
layout: post
title:  "WiiU 破解"
date:   2016-12-08 16:35:32 +0800
categories: fun
---

WiiU 破解。

**目录**

* [0 前言](#preface)
* [1 原理](#underTheHood)
* [2 想玩的游戏](#games)
* [3 用wup方式安装](#wup)
	* [限制](#wupLimit)
	* [好处](#wupBenefit)
	* [事先准备](#wupPrepare)
	* [过程](#wupProcess)
* [4 GX2的方式安装](#GX2)
* [5 疑惑](#question)
* [6 Reference](#reference)


# 0 前言<a name="preface"></a>

好几年前买了个Wii U，一直积灰，没怎么玩儿。从小就喜欢玩游戏，小时候玩得老开心了，隔壁就是游戏厅，现在当码农和我喜欢玩儿游戏也有关系，毕业后就不怎么玩儿了。无意间发现Wii U已经破解了，并且不用实体盘，以前仅仅是破解了wii模式。貌似销量还出现了一个小高潮。废寝忘食看了好多相关的文章，应该能玩起来了，流程也简单。简单梳理一下。


# 1 原理<a name="underTheHood"></a>



首先说一下当前的破解方式的简单的原理，破解第一步就是利用浏览器的kernel漏洞，访问漏洞网页，激活该漏洞，使得用户可以用到user land的内存区域。第二步就是也是访问网页加载各种自制程序了，包括一些wup installer 伪装等软件。当然最重要的就是运行wiiu的备份游戏的工具loadiine GX2（最近的图形界面版，非早期的loadiine 文字版）。当然由于网页漏洞程序的进化，现在已经可以做到点击网页网址直接加载hbl或者GX2程序了。关于WiiU.91wii.com的使用方法在后面，和下面的过程是一样一样，说一下目前最新的对个人用户来说方便运行游戏的方法

# 2 想玩的游戏<a name="games"></a>

| 中文名  | 英文名  | 是否有ticket |
|:------------- |:---------------:| -------------:|
| 刺客信条 黑旗      | Assassin's Creed IV: Black Flag |         有 |
| 猎天使魔女2  	  | Bayonetta  2                    |         有 |
| 零：濡鸦之巫女     | Fatal Frame: Maiden of Black Water   |     无 |
| 超级马里奥3D世界   | Super Mario 3D World        |       有，已下载 |
| 任天堂明星大乱斗   | Super Smash Bros.        |            有     |
| 塞尔达传说：风之杖 | The Legend of Zelda Wind Waker HD  | 有      |
| 塞尔达传说 无双   | 还没查        |            还没查              |
| 皮克敏3          | Pikmin 3        |             有             |
| 蝙蝠侠 阿甘城     | Batman        |           有                 |
| 怪物猎人3G HD    | Monster Hunter         |          有          |
| 雷曼：传奇        | Rayman Legends        |          有,已下载    |
| 光之子           | Child of Light        |            没有       |
| 新超级马里奥兄弟U  | New Super Mario Bros. U        |    有       |
| 马里奥赛车        | New Super Mario Bros. U        |    有       |
| 新超级马里奥兄弟U  | Mario Kart 8        |    有，已下载           |
| 大金刚：热带急冻   | Donkey Kong Country Tropical Freeze         |    有 |


 
# 3 用wup方式安装<a name="wup"></a>

## 1 限制<a name="wupLimit"></a>

1. 不能跨区，即欧版只能玩欧版的
2. 一次只能安装一个游戏
3. 如果要在HDD上安装，则需要将HDD格式化为WiiU格式。 注意它会删除该驱动器上的一切。
4. 为了让您的HDD被识别，您可能需要使用分割USB电缆
5. 得有ticket才行

## 2 好处<a name="wupBenefit"></a>

1. 游戏支持在线联机
2. 购买DLC和更新工作正常
3. 您可以安装游戏到内部存储，而无需安装到USB
4. 您可以将安装到您的硬盘驱动器的游戏转移到您的内部存储，它会运行正常
5. 移动这个游戏到USB外部存储设备


## 3 事先准备<a name="wupPrepare"></a>

### 1 硬盘
硬盘，最好Y线。（我觉得没啥必要，因为反只能装一个，如果内部存储空间够，没必要挂个硬盘）

### 2 升级

升到最新系统5.5.1


### 3 下载游戏文件

#### 1 ticket

这里有目前收集到的[ticket集合](http://www.91wii.com/thread-73242-1-1.html)，我用欧版的。

#### 2 下载

用JNUSTool-MOD-v0.6.5.jar 或者 NUS Downloader .Net 去任天堂服务器下载。[JNUSTool-MOD的下载地址](https://github.com/Olmectron/JNUSTool/releases)需要安装java虚拟机，设置commonkey为D7B00402659BA2ABD2CB0DB27FA2B656 。然后就把title.tik文件拖到JNUSTool里面，注意拖动的时候，要把当前选中窗口放在JNUSTool上，然后再去拖，不然会出现输入不了Name。

还有个NUS Downloader .Net[源码](https://github.com/huanfeng/NUS_Downloader_Net),需要安装[NDP46-KB3045557-x86-x64-AllOS-ENU.exe](http://down.tech.sina.com.cn/page/43589.html)从这里下的才可以。在官网下的dotNetFx40_Full_setup.exe下了半天不管用。
### 4 一张SD卡

#### 1 格式化

SD卡格式化成FAT32

#### 2 Pack HBL

Pack HBL,然后在里面放Pack HBL包http://pan.baidu.com/s/1hrW2at2 ，把wiiu的文件夹拖到SD卡根目录

#### 3 wupinstaller

然后把wupinstaller-mod的里wupinstaller文件夹放到wiiu>>apps的文件夹里。新版本wupinstaller美日欧通用,  [下载地址](http://pan.baidu.com/s/1cMLqdo)

#### 4 把游戏放进去

下载的游戏有install文件夹，把这个文件夹拖到SD卡根目录里（放游戏文件(.app, .h3,etc.)到你的sd卡上 SD:/install/文件夹内）
注意JNUSTool-MOD，下载的把title.cert给漏了,说是从别的拷贝过来一个就好了。
必须保证里面有title.tik和title.cert,title.tmd。

#### 5 整理结果
结果整理如下，只要把游戏文件（.app, .h3）放倒install 里面。



## 4 过程<a name="wupProcess"></a>
1. 把硬盘插到wiiu上，供电线插到下面，会提示格式化，等待格式化好（可以不插）
2. 打开wiiu浏览器访问 wiiu.91wii.com
3. WebExploits for 5.5.1
4. PHP WebExploits for 5.5.1
5. Homebrew Launcher 
6. 点完就如下图，点下一页最后一个wupinstaller mod，点load
7. 进入加载页面，点X就安装在硬盘里了，（点a是安装到系统的64G内存里，更方便）
8. 安装好会提示的，接着就愉快的玩了，再也不用每次开机都引导了，然后把install里的文件删了就可以再安装第二个游戏了
《删除位于SD：/ install /文件夹上的所有文件。》

备注：现在玩游戏就好像直接从eshop买的数字版游戏一样，所以会检查你是不是最新版本，马车8是要你升级的，直接点升级就好了，和正版一样很方便，也可以联机没有问题（失败就多点几次，不行挂vpn）

# 4 GX2的方式安装<a name="GX2"></a>
1. 放好Loadiine GX2格式的游戏
2. 放好程序破解包(破解程序包更多内容往下面看)。
3. 访问破解网址
    1. 使用下面的自建服务器方式
    2. 使用wiiu.91wii.com
    3. 使用wiiubru.com 网址
4. 运行 Loadiine GX2 玩游戏。


[整理一下当前的WiiU用Loadiine GX2玩备份游戏的破解方式的过程 支持5.5.x](http://www.91wii.com/thread-69775-1-1.html)


# 5 疑惑<a name="question"></a>

1. 怎么把内部存储里面的拷贝出来？是不是下次就不用安装了，直接可以拷进去就好了
2.  JNUSTool-MOD这个工具不太会用搜索功能，Title site我看老版本没有这个字段设置，新版本有了。可以下一个之前的版本看看。
3. 尚未完全理解这几种方式 http://www.91wii.com/thread-74146-1-1.html
4. 主要是想玩儿《零》，但是没有欧版的ticket，需要跨区。

    
# 6 参考<a name="reference"></a>
0. [主要的信息只要从这里看就好了，大多数工具信息都是从这里看的 ](http://www.91wii.com/forum-117-1.html)
1. [WIIU伪装教程 WUP Installer使用教程](http://www.paopaoche.net/tv/100192.html)
2. [具体 ID 可以到这个网站查](https://wiiu.titlekeys.com/)  
3. [检查修复 WiiU 硬盘版游戏文件完整性的两个方法](http://91wii.com/thread-73373-1-1.html)
4. [沈氏简包 551破解速成](http://bbs.duowan.com/thread-44512267-1-1.html)
5. [WIIU5.5.1破解 WIIU5.5.1超简单破解教程(无需自建服务器)](http://www.paopaoche.net/tv/100197.html)
6. [WIIU破解使用硬盘U盘安装游戏教程](http://www.paopaoche.net/tv/110162.html)
7. [访问这个网站可以破解http://wiiu.91wii.com/index540-551.html](http://wiiu.91wii.com/index540-551.html)
8. [WiiU 5.5/5.5.1 破解](http://chengandpeng.github.io/2016/05/13/wiiuhack/)
9. [整理一下当前的WiiU用Loadiine GX2玩备份游戏的破解方式的过程 支持5.5.x](http://www.91wii.com/thread-69775-1-1.html)
10. [总结,实现了一部分，也理解了一部分](http://www.91wii.com/thread-74146-1-1.html)


当前WIIU的破解可谓日新月异啊，我也是跟着新技术在向前进，整天捣鼓。一边删loadiine格式的游戏，一边下载WUP格式的游戏，也做过REDNAND。
1、有tik文件的WIIU游戏，从任天堂网站下载美版，安装在真实系统下，直接在真实系统的WIIU MENU下运行，方便。这个是游戏主力，我绝大多数游戏都是这样的，开机就能玩。  
2、安装“脑锻炼”，脑锻炼可以免浏览器破解直接进入HBL，进入HBL后可以选择loadiine游戏或者CFW（IOSUX，基于SYSNAND的破解）或者WUP安装游戏。并且我已经将真实系统改成全区，可以安装任何版本游戏。
3、有DLC的，或者ESHOP的，或者REDNAND的，或者loadiine的游戏，反正就是那些无法在真实系统下直接运行的，开机后先用“闹锻炼”进入HBL，引导进入基于SYSNAND的IOSUX或loadiine gx，然后再运行这些游戏，也不是很麻烦。
4、中文汉化游戏，我选择了可以在真实系统下直接运行的汉化方式，“塞尔达风之杖”和“塞尔达黄昏公主”
最终实现，免浏览器破解，以真实的全区系统玩USB安装游戏为主，兼顾汉化游戏。通过方便的VC进入IOSUX兼顾DLC游戏，最后是LOADLIINE格式游戏，都可以很方便的开机快速开始玩耍。


1. [用wup 方式安装详细步骤见图文教程](http://www.91wii.com/thread-73247-1-1.html)
2. [通过真实系统安装VC脑锻炼游戏，在真实系统下直接进HBL](http://www.91wii.com/thread-73798-1-6.html)
3. [IOSUX 基于SYSNAND的破解](http://www.91wii.com/thread-73817-1-1.html)
4. [真实系统改全区](http://www.91wii.com/thread-73827-1-6.html)
5. [硬盘WUP安装游戏](http://www.91wii.com/thread-73242-1-2.html)
6. [在真实系统直接运行汉化游戏 ](http://www.91wii.com/thread-73937-1-1.html)