#!/usr/bin/env python
# coding: utf-8

# # 基于YOLOv8的井盖检测模型

# In[1]:


get_ipython().system('pip install -U ultralytics')
get_ipython().system('wandb disabled')


# In[2]:


from ultralytics import YOLO
model = YOLO('yolov8n.pt')


# In[3]:


model.train(data='/kaggle/input/manhole-for-yolov8/data.yaml', seed=42, epochs=100)

