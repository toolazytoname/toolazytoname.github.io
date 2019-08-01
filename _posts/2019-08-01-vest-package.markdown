---

layout: post
title:  "iOS 马甲包制作指南"
date:   2019-8-1 20:29:32 +0800
categories: iOS
catalog:  true
tags:
    - iOS
    - 自制工具
---





# 来由

公司有段时间想上马甲包，调研了一下，虽然最终没上，所以记录一下。

这是一个和苹果斗智斗勇的过程，当然从开发生态来看，这不是一件好事，不鼓励。





总结了一下，大体是这么个思路

# 技术层面

基本上参考 [自动翻新专家(WHC_ConfuseSoftware)](https://github.com/netyouli/WHC_ConfuseSoftware) 就很完美了，可惜是闭源的。也有无私的同学贡献了一个开源的工具[iOS 马甲应用工具](https://github.com/klaus01/KLGenerateSpamCode)，回想起我之前用Python 写过一个批量更改类名前缀的脚本[使用脚本批量重命名Objective-C类]({{site.url }}//ios/2018/07/09/FDTops/ )，有了这个，那个的功能就有点弱爆了。

下面列一下，需要从源码层面做哪些修改

- 修改类名前缀，包括category的前缀

- 图片修改哈希值，修改文件名，包括Xcassets中的

- 支持忽略路径

- 删除注释和空行

- 添加垃圾代码

- 修改工程名

  

# 社工层面

1. 开发者帐号： 两个马甲包不要关联到同一个开发者帐号的信息；比如打包时关联。

2. 打包电脑： 有条件的最好用不同的Mac来打包
3.  上传IP： 上传马甲包时，IP不要跟其他马甲包的IP相同；
4. 材料相似：iTU后台材料如宣传图，ICON，版权人不要出现相同；

# 现有工具

[自动翻新专家(WHC_ConfuseSoftware)](https://github.com/netyouli/WHC_ConfuseSoftware)

[iOS 马甲应用工具](https://github.com/klaus01/KLGenerateSpamCode)

# 参考

1.  [iOS马甲包、代码混淆、编译混淆实现规避苹果审核](https://zhuanlan.zhihu.com/p/53396745)
2.  [苹果2.1大礼包”审核被拒，这有份iOS马甲包混淆方案](http://home.bdqn.cn/thread-116827-1-1.html)
3.  [iOS马甲包审核以及常见审核问题](http://jianshu.com/p/77b6869d648e))

