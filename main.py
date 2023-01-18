import os
print(os.environ.get("MAPS_API_KEY", "Not Found")[:5], "...")