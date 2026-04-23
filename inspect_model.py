import joblib
import os

model_path = r'c:\Users\shrey\OneDrive\Desktop\dev\PROJECTS\Zenthera\aiModel\models\random_forest.joblib'
config_path = r'c:\Users\shrey\OneDrive\Desktop\dev\PROJECTS\Zenthera\aiModel\models\metadata_config.joblib'

print(f"Inspecting {model_path}...")
rf = joblib.load(model_path)
print(f"Features in: {rf.n_features_in_}")

if os.path.exists(config_path):
    config = joblib.load(config_path)
    print(f"Config keys: {config.keys()}")
    if 'antibiotics' in config:
        print(f"Trained with {len(config['antibiotics'])} antibiotics")
        print(f"Antibiotics: {config['antibiotics']}")
else:
    print("No metadata_config.joblib found.")
