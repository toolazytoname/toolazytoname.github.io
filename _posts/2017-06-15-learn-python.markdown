---
layout: post
title:  "python入坑留念"
date:   2017-06-015 17:50:32 +0800
categories: python
catalog:  true
tags:
  - python 
---


这又是一件拖了很久的事情。为什么要学习python呢？用途很广，能做好多事情。接触的多了，自然手痒，心痒，找本书好好看看。看的是这本[Dive Into Python 3](http://www.diveintopython3.net/index.html)

自己随手记录了一下，做个看到哪儿的标记

# Your First Python Program

This call fails, because you have a named argument followed by an unnamed (positional) argument, and that never works. Reading the argument list from left to right, once you have a single named argument, the rest of the arguments must also be named.


You can get a part of a list, called a “slice”, by specifying two indices. The return value is a new list containing all the items of the list, in order, starting with the first slice index (in this case a_list[1]), up to but not including the second slice index (in this case a_list[3]).

这个有点奇怪啊，光看结果竟然没猜到是这个规则


extend 和append的区别，一针见血

~~~python
>>> a_list = ['a', 'b', 'c’] 
>>> a_list.extend(['d', 'e', 'f']) ① 
>>> a_list ['a', 'b', 'c', 'd', 'e', 'f’] 
>>> len(a_list) ② 
6
 >>> a_list[-1] 
'f’ 
>>> a_list.append(['g', 'h', 'i']) ③ 
>>> a_list ['a', 'b', 'c', 'd', 'e', 'f', ['g', 'h', 'i']] 
>>> len(a_list) ④ 
7 
>>> a_list[-1] 
['g', 'h', 'i’]

~~~


As you might expect, the count() method returns the number of occurrences of a specific value in a list. 
这么先进，貌似Objective-c 里面没这个方法吧



The index() method finds the first occurrence of a value in the list. In this case, 'new' occurs twice in the list, in a_list[2] and a_list[4], but the index() method will return only the index of the first occurrence. 

这个我猜到了，就是返回第一个出现的元素，一般找不到都会返回一个-1，这个拽，直接 抛异常



~~~python

>>> del a_list[1]         ①
>>> a_list.remove('new')  ①
>>> a_list.pop()   ①
>>> a_list.pop(1)  ②

~~~

删除的花样真多

In a boolean context, an empty list is false. 


The major difference between tuples and lists is that tuples can not be changed. 
都忘了swift 里面的元组是不是也是这样子。





* Tuples are faster than lists. If you’re defining a constant set of values and all you’re ever going to do with it is iterate through it, use a tuple instead of a list.
* It makes your code safer if you “write-protect” data that doesn’t need to be changed. Using a tuple instead of a list is like having an implied assert statement that shows this data is constant, and that special thought (and a specific function) is required to override that.
* Some tuples can be used as dictionary keys (specifically, tuples that contain immutable values like strings, numbers, and other tuples). Lists can never be used as dictionary keys, because lists are not immutable.

既然人家元组不能变了，总归有不能变的优点，下面就是优点，为啥我对第三点理解不了，第二点倒是猜到了


下面这点，不看文档，我也是猜不到的，后面还要跟这个逗号是什么鬼，还能这么玩儿呀，有点意思

~~~python

>>> def is_it_true(anything): 
...   if anything:
 ...     print("yes, it's true”)
 ...   else:
 ...     print("no, it's false”)
 ... >>> is_it_true(()) ①
 no, it's false 
>>> is_it_true(('a', 'b')) ② 
yes, it's true 
>>> is_it_true((False,)) ③
 yes, it's true 
>>> type((False)) ④
 <class 'bool’> 
>>> type((False,)) <class 'tuple’>

①
In a boolean context, an empty tuple is false. 
②
Any tuple with at least one item is true. 
③
Any tuple with at least one item is true. The value of the items is irrelevant. But what’s that comma doing there? 
④
To create a tuple of one item, you need a comma after the value. Without the comma, Python just assumes you have an extra pair of parentheses, which is harmless, but it doesn’t create a tuple. 
~~~


因为Objective-c 里面 没有元组，所以这些花样都看着挺新鲜.还能这么赋值的，开脑洞

v is a tuple of three elements, and (x, y, z) is a tuple of three variables. Assigning one to the other assigns each of the values of v to each of the variables, in order

用起来果然cool，一般都得有一个for循环



这点呀，倒是一样，{ }就是字典，晕了，原来惯常就是用来表示元组，只有空的时候才是字典，历史原因。
Due to historical quirks carried over from Python 2, you can not create an empty set with two curly brackets. This actually creates an empty dictionary, not an empty set.


The symmetric_difference() method returns a new set containing all the elements that are in exactly one of the sets.
集合操作，这个得看一下解释，别的都很直观

a_dict = {'server': 'db.diveintopython3.org', 'database': 'mysql’}
这种语法糖都差不多啊


# Comprehensions



因为前两天看过编程随想博客的python 函数式相关变成的的一篇博客，所以基本上能看懂了


❝ Our imagination is stretched to the utmost, not, as in fiction, to imagine things which are not really there, but just to comprehend those things which are. ❞
— Richard Feynman


能不能不要这么拽，这句话我理解了半天。我的直译理解是：我们的想象力已臻极致，但这一切不是空想。只要里你理解了其中的本质，它就是真的。

确实想象力很丰富，


# Strings

For instance, you’re probably familiar with the asciiencoding, which stores English characters as numbers ranging from 0 to 127. (65 is capital “A”, 97 is lowercase “a”, &c.) English has a very simple alphabet, so it can be completely expressed in less than 128 numbers. For those of you who can count in base 2, that’s 7 out of the 8 bits in a byte.
这句话，最后一句看不太懂


从历史发展的角度，抛出一个个问题，为了解决问题，迎来了新的解决方案，这名字也起得好。Unicodo 难怪要翻译成统一码。最后琢磨出一个可变长的字符编码方式。UTF-8。




The one difference is that, with the bytearray object, you can assign individual bytes using index notation. The assigned value must be an integer between 0–255.


bytes object 之前操作的比较少。

整体上strings 的一些操作，我认为和别的语言差不多。当然这是在没有深入理解的前提下得出的一个结论。


# Regular Expressions


之前看过那个30分钟入门正则表达式，结果还是每次用都得重新看一遍，记不住。😳。
简单扫了一眼，打算跳过了，差不多。
后面懒得看了，哈哈，用到再说吧。

基本代码应该能看懂了吧。试试。

	

	


