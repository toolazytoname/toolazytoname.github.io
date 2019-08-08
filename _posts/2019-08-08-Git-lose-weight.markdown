---

layout: post
title:  "Git工作目录瘦身"
date:   2019-8-8 16:19:32 +0800
categories: Git
catalog:  true
tags:
  - Git
  - iOS  
  - 组件化
  - 自制工具
  - Shell
---



iOS组件化系列

1.  [《使用Cocoapods创建私有podspec》]({{ site.url }}/ios/2018/06/23/private-podspec/) 
2.  [《使用Cocoapods 踩过的坑》]({{ site.url }}/ios/2018/07/04/private-podspec-FAQ/) 
3. [《定时取源码执行pod lib lint校验》]({{ site.url }}/ios/2018/07/13/FDPodBot/) 
4.  [《cocoapods依赖关系导出》]({{ site.url }}/ios/2018/12/27/cocoapods-graph/) 
5.  [《iOS 组件二进制》]({{ site.url }}/ios/2019/08/01/cocoapods-binary//) 
6.  [《Git工作目录瘦身》]({{ site.url }}/git/2019/08/08/Git-lose-weight/) 



# 由来

cocoapods在组件化过程中，有的团队会把Pods上传，有的不会。我认为在壳工程中，Pods纳入版本管理是有必要的，在单个pod工程中，就显得有点冗余了。我们团队有的pod因为引入的第三方组件库比较多，Git工程目录的大小甚至达到了1G多。为了瘦身，所以我写了个脚本，去自动完成这件高风险的事情。

## 脚本

~~~shell
#! /bin/sh
#--------------------------------------------
# a shell used for  pod lose weight
#
# How to use：
#         (1) get clone this repository
#         (2) chmod +x FD***.sh
#         (3) 在GitLab上新建一个repo，例如 http://gitlab.bitautotech.com/weichao/WelfareThin
#         (4) 想删除单个目录，记得斜杠结尾
#              ./FDLoseWeight.sh  /Users/yiche/Code/test/WelfareMirror（库的根目录） Example/Pods/（想删除的文件夹） http://gitlab.bitautotech.com/weichao/WelfareThin（新目录地址）
#         (5) 想删除多个目录，每个目录斜杠结尾 ，用逗号隔开
#             ./FDLoseWeight.sh  /Users/yiche/Code/test/WelfareMirror（库的根目录） Example/Pods/,Example2（想删除的文件夹数组） http://gitlab.bitautotech.com/weichao/WelfareThin（新目录地址）
#  最理想状态是直接在当前remote操作，但是操作了以后文件是删了，没瘦下来，所以退而求其次，推了个新库。
#  如果要改原来的，在这里把分支保护给关掉http://gitlab.bitautotech.com/weichao/WelfareMirror/settings/repository  点击unprotect，记得完事后重新保护上
#  可以通过如下命令找到大文件
#  https://www.cnblogs.com/lout/p/6111739.html
#  git verify-pack -v .git/objects/pack/pack-*.idx | sort -k 3 -g | tail -5
#  git rev-list --objects --all | grep 8f10eff91bb6aa2de1f5d096ee2e1687b0eab007
#--------------------------------------------


if [ ! -n "$1" ] ;then
    echo "You have not input a folder path that is git root. "
else
    echo "The folder path that  input is $1"
fi

if [ ! -n "$2" ] ;then
    echo "You have not input a  path to remove. "
else
    echo "The  path to remote is $2"
    # Example/Pods/
    # Example/
fi

if [ ! -n "$3" ] ;then
    echo "You have not input a  thin repo. "
else
    echo "The  thin remote remote is $3"
    # http://gitlab.bitautotech.com/weichao/WelfareThin
fi


echo "run cd"
cd $1
echo "pwd resut:"
pwd
echo "开始瘦身:"

#  .gitignore 自己手动加吧,当然也可以用脚本加
# echo "Example/Pods/" >> .gitignore
# git add .gitignore
# git commit -m "Add Example/Pods/ to .gitignore"

git pull --all
# 清除文件
oldIFS=$IFS
IFS=,
directory_to_remove_array=($2)
IFS=$oldIFS
for directory_name in ${directory_to_remove_array[@]}; do
  git filter-branch --force --index-filter "git rm -r --ignore-unmatch --cached $directory_name" --prune-empty --tag-name-filter cat -- --all
done

#Whenever you clone a repo, you do not clone all of its branches by default.
#If you wish to do so, use the following script:
for branch in `git branch -a | grep remotes/origin | grep -v HEAD | grep -v master `; do
   git branch --track ${branch#remotes/origin/} $branch
   # echo "log: git branch --track ${branch#remotes/origin/} $branch"
   # log: git branch --track RMLogin remotes/origin/RMLogin
done
# https://stackoverflow.com/questions/67699/how-to-clone-all-remote-branches-in-git
# remotes/origin/RMLogin
# remotes/origin/develop
# remotes/origin/flutter
# remotes/origin/navigation
# for branch in  `git branch -r | grep -v 'HEAD\|master'`; do
#  git branch --track ${branch##*/} $branch;
# done

# 虽然上面我们已经删除了文件, 但是我们的repo里面仍然保留了这些objects, 等待垃圾回收(GC), 所以我们要用命令彻底清除它, 并收回空间.
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --aggressive --prune=now

# 推送我们修改后的repo
# git push origin --force --all
# git push origin  --force --tags

# git remote remove origin
git remote add thin $3
git push -u thin --all
git push -u thin --tags

~~~



# 未完成



1. 对于 shell 变量中的# 和 ## 的使用不太了解，目前没找到相关的资料。
2. 功能上，虽然本地库瘦下来了，但是对原repo，瘦不下来。所以退而求其次，推到了一个新的瘦repo上。

# 参考

1. [.git文件过大！删除大文件](https://www.cnblogs.com/lout/p/6111739.html)
2.  [Git如何永久删除文件(包括历史记录)](https://www.cnblogs.com/shines77/p/3460274.html)
3. [how-to-clone-all-remote-branches-in-git](https://stackoverflow.com/questions/67699/how-to-clone-all-remote-branches-in-git)

