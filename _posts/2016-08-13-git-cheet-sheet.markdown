---
layout: post
title:  "Git速查表"
date:   2016-08-13 23:27:32 +0800
categories: tool
catalog: true
tags:
  - tool
---


**目录**

1. [ 文章来由](#background)
2. [ 思维导图](#map)
3. [Git工作流规范](#workflow)


1 文章来由<a name="background"></a>
===

关于版本控制系统，刚毕业那会儿因为在.Net 平台开发，用的是TFS，后来接触了SVN，一直都是GUI操作，因为GitHub的关系，用了点Git，也没感觉，瞎用呗。直到去年进现在的公司，才开始在公司项目中使用Git，后知后觉，相见恨晚，迅速转粉，而且是脑残粉。简直好用到爆。

下面是简单的整理。慢慢补充。整理的原因是记性不太好，放这里方便自己查。

[原书链接](https://git-scm.com/book/en/v2)

2 思维导图<a name="map"></a>
===

一开始用MindNode编写，然后用FreeMind导出成HTML。

点击[HTML 文件]({{ site.url }}/assets/Git-Cheet-Sheet/freemind.html)
跳转到新页面查看。


<iframe src="{{ site.url }}/assets/Git-Cheet-Sheet/freemind.html" width="100%" height="100%" ></iframe>


3 Git工作流规范<a name="workflow"></a>
===

规范
====

1. 分支命名规则

  1.  各个仓库至少有两个分支master分支和develop分支。

  2.  master分支：同步线上AppStore 代码。

  3.  develop分支:当前开发代码。(当然如果某个业务线习惯当前开发版本新建一个分支也可以,不强求，例如develop10.0.0,但是最终要往develop上面merge)。

2. 分支合并规则 

  1. 为了尽可能避免冲突，肯定是从下往上逐层合并，fix10.0.2往develop上面merge，develop 往master上面merge。所有的冲突都是在develop上解决，master是稳定的版本，坑定是develop往master merge，并且都是fast-forward merge，不会出现冲突。

  2. 线上包一般都是从master出，如果临时有问题需要紧急修复，那么会从hotfix出，例如fix10.0.2 。出包直接从这个新的分支出。出完包以后，再往develop上merge，develop验证没问题以后再往master上面merge。

3. tag 命名规则

  1. 常规开发流程中发App Store，tag号加前缀AppStore，例如AppStore10.0.2，日常开发没有前缀。

  2. 临时紧急修复tag，各业务线和组件加前缀fix加上对应的问题版本号，例如fix10.0.2，壳工程比较特殊

    例如根据各个业务线对应fix10.0.2打出来的包，壳工程应该是AppStore10.0.3。 

  3. 壳工程所在仓库每次发AppStore，master分支或者fix分支必须有一个对应的tag号，例如AppStore10.0.2与苹果商店版本号对应，切记一定要是全量代码，包括pods部分和target工程配置，因为有部分代码可能会临时修改，没有包括在业务线的tag号中。






整体思路
====
主要采用Long-Running Branches 的工作流，如果是hotfix则结合一部分Topic Branches。
只在 master 分支上保留完全稳定的代码，发布AppStore的代码。
还有一些名为 develop 或者 hotfix 的平行分支,被用来做后续开发或者测试稳定性,这些分支不必保持绝对稳定，但是一旦达到稳定发布AppStore状态，它们就可以被合并入 master 分支了。 这样，在确保这些已完成的特性分支（短期分支，比如之前的 hotfix 分支）能够通过所有测试，并且不会引入更多 bug 之后，就可以合并入主干分支中，等待下一次的发布。
参考书籍章节[Git-Branching-Branching-Workflows](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)

![渐进稳定分支的线性图]({{ site.url }}/assets/2016-08-13-git-cheet-sheet0.png)

渐进稳定分支的线性图








