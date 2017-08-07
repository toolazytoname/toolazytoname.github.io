---
layout: post
title:  "树莓派"
date:   2017-08-07 15:32:32 +0800
categories: hack your life
catalog:  true
tags:
  - hack your life
---





N年前入手了树莓派，吃了好多年灰。
无意间回顾了一下，自己在2012年四月前，就已经在央视的电视上，看到了树莓派的信息。
把玩了一下，也踩了一些坑，记录一下，方便自己查看。

# 安装操作系统

来安个操作系统，参照这上面的就可以了[INSTALLING OPERATING SYSTEM IMAGES](https://www.raspberrypi.org/documentation/installation/installing-images/README.md)

1. download the[image](https://downloads.raspberrypi.org/raspbian_latest) 
2. 下一个 Etcher 用来将镜像写到SD卡中

运气还真不错，还真是碰上了SD卡不兼容的情况，可以通过[RPi SD cards](http://elinux.org/RPi_SD_cards) 查询。

# 打开SSh功能
最新版本的树莓派系统，默认关闭了SSH功能，所以，你需要把sd卡插在Windows/Mac电脑上，可识别的分区上，创建一个空文件，名字是ssh，以开启SSH功能。



# 启动自动打开命令行界面

~~~bash
sudo raspi-config
~~~


# 图形界面，如何避免自动挂载移动硬盘

在图形化界面中，打开文件管理器（file manager）
依次点击 Edit -> Preferences
点击选项 Volume Management


# 挂载移动硬盘
平常用Mac打算兼容windows，就格式化成ExFAT

~~~bash
sudo apt-get install exfat-fuse 
~~~
   

~~~bash
blkid /dev/sda2
~~~

fstab 文件添加
以下内容

~~~bash
PARTUUID=f5a7b6b2-09f0-4e5e-8012-9b5726d68e5d  /mnt/Disk1T exfat defaults,auto,umask=000,users,rw 0 0
~~~
修改完了fstab 以后，别忘了用

~~~bash
mount -a
~~~

试一下，不然下次很可能影响开机启动，我就试了一次，害得给他插上鼠标键盘显示器，老麻烦了。


# AirPlay 音樂播放器

这个功能参考页面[使用 shairport-sync 在 Raspberry Pi 上上建立 AirPlay 音樂播放器](https://coldnew.github.io/70c5ffb9/)

~~~bash
sudo apt-get install build-essential git autoconf libtool \
     libdaemon-dev libasound2-dev libpopt-dev libconfig-dev \
     avahi-daemon libavahi-client-dev \
     libssl-dev
     
     
git clone https://github.com/mikebrady/shairport-sync.git

cd shairport-sync && autoreconf -i -f

./configure \
    --with-alsa --with-stdout --with-pipe --with-avahi \
    --with-ssl=openssl --with-metadata --with-systemd
    
    
    
make install

groupadd -r shairport-sync

useradd -r -M -g shairport-sync -s /usr/bin/nologin -G audio shairport-sync


systemctl enable shairport-sync

systemctl start shairport-sync

~~~



# 测量设备温度
vcgencmd measure_temp

# 反向隧道内网穿透
可以从外网访问树莓派


参考 这篇文章[ssh内网穿透连接树莓派](https://github.com/ma6174/blog/issues/7)的一个评论继续深挖到一片自认为比较规范的文章 [使用SSH反向隧道进行内网穿透](http://arondight.me/2016/02/17/%E4%BD%BF%E7%94%A8SSH%E5%8F%8D%E5%90%91%E9%9A%A7%E9%81%93%E8%BF%9B%E8%A1%8C%E5%86%85%E7%BD%91%E7%A9%BF%E9%80%8F/
)


~~~bash
[Unit]
Description=Auto SSH Tunnel
After=network-online.target
[Service]
User=autossh
Type=simple
ExecStart=/bin/bash /home/pi/autossh.sh
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process
Restart=always
[Install]
WantedBy=multi-user.target
~~~

把这下面这句话写成了一个服务，启动时机是在After=network-online.target，但这一点没有试通，因此变通的方法是在脚本之前加了一个sleep



autossh.sh

~~~bash
autossh -p 22 -M 6777 -NR '*:6766:localhost:22' -i /home/pi/aws.pem.txt ec2-user@ec2-54-191-70-154.us-west-2.compute.amazonaws.com

~~~

~~~bash
systemctl list-unit-files -a|grep -i network
sudo systemctl enable systemd-networkd-wait-online
sudo systemctl start systemd-networkd-wait-online


sudo chmod 644 /lib/systemd/system/autossh.service
chmod +x /home/pi/autossh.sh
sudo systemctl daemon-reload
sudo systemctl enable autossh.service
sudo systemctl start autossh.service


sudo systemctl status hello.service
sudo journalctl -f -u autossh.service
~~~






我直接在外网任何一台终端，可以通过访问


~~~bash
ssh -p 6766 -i  ~/Downloads/aws.pem.txt  pi@publicServer
~~~


# 安装 resilio-sync

[官方安装指南](https://help.resilio.com/hc/en-us/articles/206178924-Installing-Sync-package-on-Linux
)

因为我这个是比较早的树莓派，应该是文中所谓的For Raspberry Pi 1，一共三步

1. Add repository
    * Create file /etc/apt/sources.list.d/resilio-sync.list to register Resilio repository:
2. Add PGP public key for package verification
    * Add public key with the following command:
3. Install the package
   
~~~bash
echo "deb http://linux-packages.resilio.com/resilio-sync/deb resilio-sync non-free" | sudo tee /etc/apt/sources.list.d/resilio-sync.list

wget -qO - https://linux-packages.resilio.com/resilio-sync/key.asc | sudo apt-key add -

sudo dpkg --add-architecture armel
sudo apt-get update
sudo apt-get install resilio-sync:armel

sudo systemctl enable resilio-sync.service


~~~
如果被墙了，就用下面的代替

~~~bash
wget https://linux-packages.resilio.com/resilio-sync/key.asc 
sudo apt-key add key.asc 
rm key.asc

~~~

如果sudo apt-get update 提示相应错误，可以删除 /etc/apt/sources.list.d/resilio-sync.list。文件

安装完成以后直接127.0.0.1:8888

安装完了以后折腾半天，还把 [Cannot Connect To Trackers](https://help.resilio.com/hc/en-us/articles/210587126-Cannot-connect-to-trackers
)也给翻出来，后来一搜，原来是被墙了。解决方案，等我解决以后在此更新。




# 安装samba

~~~bash
sudo apt-get install samba samba-common-bin

sudo nano /etc/samba/smb.conf
~~~
配置参考

~~~bash
# This option controls how unsuccessful authentication attempts are mapped
# to anonymous connections
   map to guest = bad user
   guest account = pi 添加这一行
   
到文件底部,添加下面几行

[Media]
comment = usb storage
path = /home/pi
browseable = Yes
read only = No
guest ok = Yes  
~~~
电视的播放器就可以访问播放这里的视频。

# 测网速
 
~~~bash
wget -O /dev/null http://speedtest.wdc01.softlayer.com/downloads/test10.zip
~~~

# hdparm

还没有搞定

  

	
