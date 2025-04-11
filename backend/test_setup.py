import os
import sys

def check_setup():
    # Get the absolute path of the current directory
    base_dir = os.path.abspath(os.path.dirname(__file__))
    images_dir = os.path.join(base_dir, 'images')
    batch_dir = os.path.join(images_dir, 'batch1')

    print("Checking directory structure...")
    print(f"Base directory: {base_dir}")
    print(f"Images directory: {images_dir}")
    print(f"Batch directory: {batch_dir}")

    # Check if directories exist
    if not os.path.exists(images_dir):
        print("ERROR: Images directory does not exist!")
        os.makedirs(images_dir)
        print("Created images directory.")

    if not os.path.exists(batch_dir):
        print("ERROR: Batch directory does not exist!")
        os.makedirs(batch_dir)
        print("Created batch directory.")

    # Check for images in batch directory
    image_files = [f for f in os.listdir(batch_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))] if os.path.exists(batch_dir) else []
    
    if not image_files:
        print("\nWARNING: No images found in batch directory!")
        print(f"Please add some images to: {batch_dir}")
    else:
        print("\nFound images:")
        for image in image_files:
            print(f"- {image}")

    # Check permissions
    try:
        test_file = os.path.join(batch_dir, 'test_permissions.txt')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        print("\nPermissions check: OK")
    except Exception as e:
        print(f"\nERROR: Permission issue with batch directory: {str(e)}")

if __name__ == "__main__":
    check_setup() 