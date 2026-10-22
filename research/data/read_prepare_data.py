"""Inspect full Data/Prepare_Data_for_NN.m script."""

import urllib.request

url = "https://raw.githubusercontent.com/avakanski/A-Deep-Learning-Framework-for-Assessing-Physical-Rehabilitation-Exercises/master/Data/Prepare_Data_for_NN.m"
content = urllib.request.urlopen(url).read().decode("utf-8")
print(content)
