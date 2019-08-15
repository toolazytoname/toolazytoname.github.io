---
layout: post
title:  "脚本批量改变文件内容"
date:   2016-07-04 14:33:32 +0800
categories: hack your life
tags:
  - hack your life
  - Shell
  - 自制工具
---
受到知乎上一个问题的启发，打算写一个简单的脚本。

源码：[HackCloudDrive](https://github.com/toolazytoname/HackCloudDrive) 已经上传了。[README](https://github.com/toolazytoname/HackCloudDrive/blob/master/README.md)写得很清楚了。

可以顺道看一下shell ，也是很有意思的，改进了一下输入的参数，使这个脚本更加强大，哈哈。



# HackCloudDrive
Use a shell to change the content of files.

# Why I write this shell
This is a shell to chane the content of files,I write this in order to change the Hash of files in *** field.

# reference
[scripts-to-traverse-folder-recursively]( http://yejinxin.github.io/scripts-to-traverse-folder-recursively/)

# how to use
1. Download the MagicShell shell 
2. chmod +x MagicShell
3. The parameter input can be 
	1. 	a directory
	
	 ~~~ 
	 ./MagicShell /Users/Downloads/testHash
	 ~~~
	
	2. directories 
	
		~~~
		./MagicShell /Users/Downloads/testHashDirectory1 ./MagicShell /Users/Downloads/testHashDirectory2
		~~~
	3. a single file 
	
		~~~ 
		./MagicShell   /Users/Downloads/testHash/		file1.txt
		~~~
	4. files 
	
		~~~
		./MagicShell   /Users/Downloads/testHash/file1.txt /Users/Downloads/testHash/file2.txt
		~~~


# at last
Those who do not understand UNIX are condemned to reinvent it, poorly.

—Henry Spencer



Where To Go From Here?
===


- [Advanced Bash-Scripting Guide](http://tldp.org/LDP/abs/html/)
- [Unix Shell Programming](http://www.tutorialspoint.com/unix/unix-shell.htm)
- [Linux Shell Scripting Tutorial - A Beginner's handbook](http://www.tutorialspoint.com/unix/unix-shell.htm)
