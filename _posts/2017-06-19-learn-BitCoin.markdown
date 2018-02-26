---
layout: post
title:  "比特币相关"
date:   2017-06-16 19:44:32 +0800
categories: hack your life
catalog:  true
tags:
  - hack your life
---



前段时间勒索病毒肆虐全球，把比特币给拱火了，也不是啥新鲜玩意儿，中国大妈都入场了，一直想找机会了解一下。顺便把一些结果记录一下，大概原理明白点了，代码没耐心看。



1. 概况
	* [Guide On How To Buy Bitcoin](https://totalbitcoin.org/guide-on-how-to-buy-bitcoin/?data2=abmg12k&data2=abmg07b )
	* 论坛 [bitcointalk](https://bitcointalk.org/index.php)
	* [常用名词](http://www.8btc.com/wiki/term)
	* [基本概念](http://www.8btc.com/wiki/bitcoin-basic-concepts)
	* [通俗解释](http://www.8btc.com/bitcoin-story)
	* [技术进阶](http://www.8btc.com/wiki/bitcoin-technical-principles)看不懂
	* [常见问题解答](http://www.8btc.com/wiki/questions-answers)
	* [比特币钱包的安全使用和完美备份 by 江枫晚霞](http://www.8btc.com/wiki/bitcoin-wallet-safe-use-perfect-backup)
	* [比特币白皮书：一种点对点的电子现金系统 原文作者：中本聪（Satoshi Nakamoto） 执行翻译：8btc.com](http://www.8btc.com/wiki/bitcoin-a-peer-to-peer-electronic-cash-system) 看不懂
2. 钱包
	*  买了个ledger nano s，貌似网上也说有人丢币了，想着总比在线钱包啥的靠谱点吧。

3. exchange service
	* [Bitstamp Exchange](https://www.bitstamp.net/)
	* [shapeshift](https://shapeshift.io/#/coins) 
4. Buy
	* [Local Bitcoins](https://localbitcoins.com/)
	* 通过[Ripple] (http://gw.iripplechina.com/course/)入场
5. tumbling service
	* Grams Helix 
	* 地址 http://grams7enufi7jmdl.onion/helix 
	* 有没有被骗，看下文
	* you can easily check if you are being scammed by examining the Bitcoin blockchain info of your output wallet at https://blockchainbdgpzk.onion/taint/yourbitcoinaddress (replace ‘yourbitcoinaddress’ with an actual Bitcoin address from your output wallet). If you are unable to find your input wallet’s address on the list you have successfully tumbled your Bitcoin. 
6. 挖矿
	* 启发 [蠕虫挖矿一例，无码](https://mp.weixin.qq.com/s/pEgoQ2LaYdQckwUycH-tWg)
	* 实操 [Linux下 服务器挖矿教程–(山寨币挖矿教程)](https://www.twice9.com/356.html)
	* 开源挖矿工具 [cpuminer-multi](https://github.com/tpruvot/cpuminer-multi)
	* 各种山寨币汇率 [bter](https://bter.com)
	* 看挖了多少[minergate](https://en.minergate.com/internal)
	* [coinhive](https://coinhive.com/dashboard)
		* [miner100]({{ site.url }}/assets/xmr.html)
		* [miner70]({{ site.url }}/assets/xmr.html)
		* [minerSimple]({{ site.url }}/xmrsimple.html)

7. Linux相关操作
	* 重定向输出到文件 ./cpuminer -a cryptonight -o stratum+tcp://xmr.pool.minergate.com:45560 -u EMAIL -p x >m.log 2>&1
	* 查看一个内容增长文件的内容 tail -f m.log
	* pstree 可以看进程间的派生关系
	* [Linux 技巧：让进程在后台可靠运行的几种方法](https://www.ibm.com/developerworks/cn/linux/l-cn-nohup/index.html)  
	* [使用 nice、cpulimit 和 cgroups 限制 cpu 占用率](https://linux.cn/article-4742-1.html) 
	* [linux计划任务crontab使用方法](http://www.tangshuang.net/2689.html)
	* [Linux自动重启nginx httpd](http://www.tangshuang.net/2691.html)
	

8. 波折
	* apt-get install zlib1g zlib1g.dev 这两个是我自己加上的，还是谷歌了一段时间才搞定的。
	* 有三台设备的挖矿程序会有不明原因退出，汗颜，😓，人家用别人的设备都能挖，我用自己的设备竟然挖不了。
	*  我试了screen/nohup/setsid/&都不管用，
		* ./cpuminer 重定向日志到文件也没啥东西打出来
		* dmesg 日志没找到相关内容
		* 差不多能撑的时间是一个ssh会话的时长。
		* CPULimit 设置在50貌似还是不行，暂时没找到原因
		* 加了个定时任务去检测挖矿程序是否挂掉，如果挂掉，那么重启
		* 升级了一下脚本，用了expect 自动登陆，安装。放GitHub上面了