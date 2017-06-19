---
layout: post
title:  "比特币相关"
date:   2017-06-16 19:44:32 +0800
categories: hack your life
catalog:  true
tags:
  - hack your life
---



前段时间勒索病毒肆虐全球，把比特币给拱火了，也不是啥新鲜玩意儿，中国大妈都入场了，一直想找几乎，了解一下。顺便把一些结果记录一下，大概原理明白点了，代码没耐心看。



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
	*  [官方推荐](https://bitcoin.org/en/choose-your-wallet)
	*  Armory 功能强大
	*  [multibit](https://multibit.org) 轻钱包 
	*  脑钱包 [GitHub地址](https://github.com/pointbiz/bitaddress.org) [网站](https://www.bitaddress.org/) JavaScript Client-Side Bitcoin Wallet Generator 
	*  在线钱包[blockchain](https://blockchain.info/wallet/#/ )
	*  纸钱包
3. exchange service
	* [Bitstamp Exchange](https://www.bitstamp.net/)
	* [Bitfinex Exchange](https://www.bitfinex.com/) 
4. Buy
	* [Local Bitcoins](https://localbitcoins.com/)
	* Buying via investment trusts
	* [比特币中国](https://www.btcchina.com) 实名制
	* [okcoin](https://www.okcoin.cn)
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
7. Linux相关操作
	* 重定向输出到文件 ./cpuminer -a cryptonight -o stratum+tcp://xmr.pool.minergate.com:45560 -u EMAIL -p x >m.log 2>&1
	* 查看一个内容增长文件的内容 tail -f m.log
	* pstree 可以看进程间的派生关系
	* [Linux 技巧：让进程在后台可靠运行的几种方法](https://www.ibm.com/developerworks/cn/linux/l-cn-nohup/index.html)  
	* [Centos中使用CPU limit限制CPU的使用率](http://www.ouvps.com/?p=570)
8. Debian安装脚本
	* cpuminer需要编译生成
	
	~~~bash
	apt-get update;
	apt-get install build-essential libcurl4-openssl-dev git automake libtool libjansson* libncurses5-dev libssl-dev zlib1g zlib1g.dev;
	git clone --recursive https://github.com/tpruvot/cpuminer-multi.git;
	cd cpuminer-multi;
	git checkout linux;
	./autogen.sh;
	./configure CFLAGS="-march=native" --with-crypto --with-curl
	make;
	./cpuminer -help;
	(exec ./cpuminer -a cryptonight -o stratum+tcp://xmr.pool.minergate.com:45560 -u Email -p x &> /dev/null &);
	
 ~~~
 
 * cpuminer现成
 
 ~~~bash
 	apt-get update;
	apt-get install build-essential libcurl4-openssl-dev git automake libtool libjansson* libncurses5-dev libssl-dev zlib1g zlib1g.dev;
	scp root@IP:/root/cpuminer-multi/cpuminer ./;
	./cpuminer -help;
	(exec ./cpuminer -a cryptonight -o stratum+tcp://xmr.pool.minergate.com:45560 -u Email -p x &> /dev/null &);

 ~~~
9. 未完成
	* 有三台设备的挖矿程序会有不明原因退出，
		* 我试了screen/nohup/setsid/&都不管用，
		* ./cpuminer 重定向日志到文件也没啥东西打出来
		* dmesg 日志没找到相关内容
		* 差不多能撑的时间是一个ssh会话的时长。
		* CPULimit 还没试过
10. 波折
	* apt-get install zlib1g zlib1g.dev 这两个是我自己加上的，还是谷歌了一段时间才搞定的。



	


