# 🔄 Restart Servers to Apply Changes

## ⚠️ IMPORTANT: You MUST restart the backend server!

The new datasets API endpoint won't work until you restart the backend.

---

## 🛑 Step 1: Stop Backend Server

Find the terminal/command prompt running the backend and press:
```
Ctrl + C
```

Or kill the process on port 5000:
```powershell
# Find the process ID
netstat -ano | findstr :5000

# Kill it (replace <PID> with the actual process ID)
taskkill /F /PID <PID>
```

---

## ▶️ Step 2: Start Backend Server

```powershell
cd backend
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
✅ Database initialized at: C:\Users\byath\OneDrive\Desktop\project\backend\land_price_prediction.db
```

---

## ✅ Step 3: Verify Backend is Running

Test the datasets endpoint:
```powershell
curl http://127.0.0.1:5000/api/datasets/
```

Should return: `[]` (empty array, meaning no datasets yet)

---

## 🌐 Step 4: Refresh Frontend

If the frontend (npm) is running, just refresh your browser:
- Go to http://localhost:5173
- Press `Ctrl + F5` (hard refresh)

If not running, start it:
```powershell
npm run dev
```

---

## 🎉 Done!

Now you should see:
1. **Datasets tab** loads without errors
2. **"No datasets uploaded yet"** message (instead of blank/loading forever)
3. **Upload form** works properly

Upload the `sample_dataset.json` file to test! 🚀
