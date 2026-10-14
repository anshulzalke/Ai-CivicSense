#!/usr/bin/env python
# coding: utf-8

# # Street Light Fault Prediction

# In[1]:


import numpy as np 
import pandas as pd 
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix



import os
for dirname, _, filenames in os.walk('/kaggle/input'):
    for filename in filenames:
        print(os.path.join(dirname, filename))


# In[2]:


file_path = '/kaggle/input/street-light-fault-prediction-dataset/street_light_fault_prediction_dataset.csv'
df = pd.read_csv(file_path)

df['timestamp'] = pd.to_datetime(df['timestamp'])
df.head()


# In[3]:


df.describe()


# In[4]:


df1 = pd.get_dummies(df, columns=['environmental_conditions'], drop_first=True)
correlation_matrix = df1.corr()
plt.figure(figsize=(10, 8))
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt=".2f", linewidths=.5)
plt.title("Correlation Matrix``")
plt.show()


# In[5]:


plt.figure(figsize=(8, 6))
sns.countplot(x='fault_type', data=df)
plt.title("Distribution of Fault Types")
plt.xlabel("Fault Type")
plt.ylabel("Count")
plt.show()


# In[6]:


import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
features = ['power_consumption (Watts)', 'voltage_levels (Volts)', 'current_fluctuations (Amperes)', 'temperature (Celsius)', 'current_fluctuations_env (Amperes)']
target = 'fault_type'

for feature in features:
    df[feature] = pd.to_numeric(df[feature].astype(str).replace('[^0-9.]', '', regex=True), errors='coerce')

df = pd.get_dummies(df, columns=['environmental_conditions'], drop_first=True)

X_train, X_test, y_train, y_test = train_test_split(df[features + list(df.columns[df.columns.str.startswith('environmental_conditions')])], df[target], test_size=0.2, random_state=42)

rf_model = RandomForestClassifier(random_state=42)
rf_model.fit(X_train, y_train)

y_pred = rf_model.predict(X_test)


accuracy = accuracy_score(y_test, y_pred)
conf_matrix = confusion_matrix(y_test, y_pred)
class_report = classification_report(y_test, y_pred)

print(f"Accuracy: {accuracy:.2f}")
print("\nConfusion Matrix:")
print(conf_matrix)
print("\nClassification Report:")
print(class_report)



# In[7]:


print("Feature names during model training:")
print(rf_model.feature_names_in_)


# In[8]:


manual_values = {
    'power_consumption (Watts)': 48.423,
    'voltage_levels (Volts)': 218.93,
    'current_fluctuations (Amperes)': 3.01,
    'temperature (Celsius)': 28.34,
    'current_fluctuations_env (Amperes)': 1.95,
    'environmental_conditions_Cloudy': False,
    'environmental_conditions_Rainy': False
}

manual_df = pd.DataFrame([manual_values])

for feature in features:
    manual_df[feature] = pd.to_numeric(manual_df[feature], errors='coerce')

manual_pred = rf_model.predict(manual_df)

print("Manual Prediction:")
print("Predicted Fault Type:", manual_pred[0])


# In[9]:


manual_values_2 = {
    'power_consumption (Watts)': 176.39,
    'voltage_levels (Volts)': 213.09,
    'current_fluctuations (Amperes)': 3.64,
    'temperature (Celsius)': 23.2,
    'current_fluctuations_env (Amperes)': 7.106,
    'environmental_conditions_Cloudy': False,
    'environmental_conditions_Rainy': False
}

manual_df_2 = pd.DataFrame([manual_values_2])

for feature in features:
    manual_df_2[feature] = pd.to_numeric(manual_df_2[feature], errors='coerce')

manual_pred_2 = rf_model.predict(manual_df_2)

print("Manual Prediction:")
print("Predicted Fault Type:", manual_pred_2[0])


# In[10]:


manual_values_3 = {
    'power_consumption (Watts)': 157.14,
    'voltage_levels (Volts)': 228.39,
    'current_fluctuations (Amperes)': 6.849,
    'temperature (Celsius)': 24.38,
    'current_fluctuations_env (Amperes)': 1.06,
    'environmental_conditions_Cloudy': False,
    'environmental_conditions_Rainy': False
}

manual_df_3 = pd.DataFrame([manual_values_3])


for feature in features:
    manual_df_3[feature] = pd.to_numeric(manual_df_3[feature], errors='coerce')

manual_pred_3 = rf_model.predict(manual_df_3)

print("Manual Prediction:")
print("Predicted Fault Type:", manual_pred_3[0])


# In[11]:


manual_values_4 = {
    'power_consumption (Watts)': 107.45,
    'voltage_levels (Volts)': 248.126,
    'current_fluctuations (Amperes)': 0.7,
    'temperature (Celsius)': 23.36,
    'current_fluctuations_env (Amperes)': 4.77,
    'environmental_conditions_Cloudy': True,
    'environmental_conditions_Rainy': False
}

manual_df_4 = pd.DataFrame([manual_values_4])

for feature in features:
    manual_df_4[feature] = pd.to_numeric(manual_df_4[feature], errors='coerce')


manual_pred_4 = rf_model.predict(manual_df_4)

print("Manual Prediction:")
print("Predicted Fault Type:", manual_pred_4[0])


# In[12]:


manual_values_5 = {
    'power_consumption (Watts)': 187.86,
    'voltage_levels (Volts)': 212.43,
    'current_fluctuations (Amperes)': 4.28,
    'temperature (Celsius)': 21.59,
    'current_fluctuations_env (Amperes)': 2.04,
    'environmental_conditions_Cloudy': False,
    'environmental_conditions_Rainy': True
}

manual_df_5 = pd.DataFrame([manual_values_5])

for feature in features:
    manual_df_5[feature] = pd.to_numeric(manual_df_5[feature], errors='coerce')

manual_pred_5 = rf_model.predict(manual_df_5)

print("Manual Prediction:")
print("Predicted Fault Type:", manual_pred_5[0])


# In[ ]:





# 
