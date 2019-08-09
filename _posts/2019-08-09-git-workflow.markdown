---

layout: post
title:  "Git工作流规范整理"
date:   2019-8-9 9:39:32 +0800
categories: Git
catalog:  true
tags:
  - Git
---



# 命名

1. 分支命名规则
   1. master：同步线上AppStore 代码。每次发版完毕，会往这里合。
   2. develop：当前开发代码。
   3. develop10.0.1：10.0.1为当前开发版本，可有可没有。(有人喜欢针对当前版本新建一个分支,建议发版以后merge入develop删除,留下tag即可)。
   4. develop_damao：大毛的开发分支，平时只允许在这个分支上push。
   5. develop_ermaoming：二毛的开发分支。
   6. . hotfix10.0.2：如果10.0.1线上崩溃，需要紧急修复，则创建一个以新版本号命名的分支。
2. tag 命名规则
   1. AppStore10.0.2：某版本线上包对应的tag号，可以在发版后标记。
   2. 0.15.2：平时打随意，保证三段即可。

# 场景

三人合作开发一个app，老大叫大毛，老二叫二毛，老三叫三毛。 
这时候大毛去gitlab开一个repository,开了如下分支

- develop
- develop_damao
- develop_ermao
- develop_sanmao

OK,现在大毛告诉，二毛和三毛，去clone 吧。clone 下来以后

二毛本地的分支只有一个

- master

现在让他们分别从远程拉两个分支，分别是develop 和develop_ermao，那么二毛本地的分支就是

- master
- develop
- develop_ermao

好了，接下来开始干活了，为了避免出现conflict 和污染主分支，做到以下几点就，一般不会出现问题

1. 做好分工，避免多人改同一个文件
2. 二毛只会在二毛自己的develop_ermao进行开发
3. 二毛只在自己的分支push
4. 如果想合并，按照如下<span style="color:red">流程（敲黑板，划重点）</span>
   1. git pull --all #为了pull develop分支，不知道什么命令可以在pull 别的单个分支
   2. git merge  develop  #合并最新的开发分支，有冲突改冲突
   3. 切换到develop ，merge develop_ermao ，push develop # 因为上一步刚刚已经merge 过新鲜的develop 了，所以这一步肯定是fast-forword merge，不会有冲突
   4. 每完成一个功能点，提交一次。

这样的流程有什么好处呢？

1. 几乎不会出现conflict
2. 永远不会污染别人的分支，公共的分支。因为即使出现冲突，也是在自己的分支内解决。
3. 如果点儿背，在电光火石的操作过程中，别人恰好提了一个到develop，以为新鲜的develop其实已经过期了。在 git push develop 的时候冲突了。提不上去。莫慌，这时候执行一下 git pull --rebase ，然后重新git push就可以了。
4. 开发的时候，本地只需要两个分支，develop ，develop_ermao
5. 每个人都可以直接push自己的分支，设计到公共的分支，必须先pull ，merge develop，merge 回develop，push。
6. 如果说工程里面，有develop10.0.1这种针对当前版本的分支，那么二毛三毛不用操心，就是大毛辛苦一点，每次新版本开始都先创建好一个新分支develop10.0.1，然后二毛，三毛直接在develop10.0.1操作。当版本结束以后，大毛再并入develop。



# 整体思路

主要采用Long-Running Branches（master，develop） 的工作流，结合一部分Topic Branches（develop_damao,develop_ermao,develop_sanmao）。
参考书籍章节[Git-Branching-Branching-Workflows](https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows)

![渐进稳定分支的线性图]({{ site.url }}/assets/2016-08-13-git-cheet-sheet0.png)

渐进稳定分支的线性图



#  参考 

1. iOS开发中的Git流程 叶孤城___       2015-10-20 10:35 





