# Flow 2D - Production Line

A 2D dashboard for visualizing and managing production line machines in real-time.

update 2.0
Default Mode
<img width="1914" height="882" alt="Screenshot 2026-03-16 110303" src="https://github.com/user-attachments/assets/ba839933-a8e7-4145-89bf-2dfbcf3a6db6" />
</br> 
To add new Machine or Operator: </br> 
<img width="400" height="auto" alt="Screenshot 2026-03-17 104952" src="https://github.com/user-attachments/assets/772ac1e6-2559-4987-af3c-20a04d248987" />


</br> 
<img width="350" height="auto" alt="Screenshot 2026-05-26 075046" src="https://github.com/user-attachments/assets/c92350c7-48da-4231-bb80-c350a91c933f" />
 </br> 
1. Click button "Save/load" </br> 
2. "Save to browser" >> save all your design on local browser storage </br> 
3. "Load From Browser" >> get your recent design from browser (only 30 minutes after deleting, after that the design will auto delete) </br> 
4. "Export to File" >> to Export file into Json file and store it on device storage </br> 
5. "Import from File" >> to use file that you already export before </br> 
6. "Clear All" >> to delete all machine and operator node on surface </br> 

</br> 
To control node connection:</br> 
<img width="350" height="auto" alt="Screenshot 2026-03-17 104155" src="https://github.com/user-attachments/assets/0a7794e8-9fd6-4ba9-bec5-8881b8cc637b" />
</br>

Shapes Mode </br>
<img width="1919" height="875" alt="Screenshot 2026-05-26 073655" src="https://github.com/user-attachments/assets/2b02a36e-2142-4c43-8926-05c5f98fc2fb" />
</br>

Click "Hide Tools" or (Ctrl + Shift + H) to make all tools desepear </br>
<img width="1919" height="876" alt="Screenshot 2026-05-26 074528" src="https://github.com/user-attachments/assets/507fe748-4fef-464d-b005-4ea0f89721d3" />
</br>
</br>
Click "Export/Embed" to get raw data  </br>
<img width="600" height="auto" alt="Screenshot 2026-05-26 080253" src="https://github.com/user-attachments/assets/e3481688-f228-4851-9adf-3ccc12e5327e" /></br>

</br>
Click "Save to DB" </br>
Save your machine and operator flow into database </br>
<img width="600" height="auto" alt="Screenshot 2026-05-26 080929" src="https://github.com/user-attachments/assets/09923faa-628f-4b5e-87b7-916ee216e210" /> </br>
</br>






TODO:
- make the delete button to delete machine
- also make it able to delete joining node machine
- make save load panel for editing line models
- fix bug "rotate text" on editing page
- add some input data (line ID)
- make connection flow from one line to another line (using path flow)
- adding "viewer mode" in tab (default and shapes) for display purposes (developer can use it to visualize their machine for their own projecn)
- adding editing shape for operator
- testing get and push data from DB


Email Me if you want to contribute... </br>
check my github profile


### 1. Install dependency baru
pnpm install

### 2. Setup .env dengan kredensial SQL Server Anda
Edit file .env

### 3. Jalankan migrasi database
node server/db/migrate.js

### 4. Jalankan aplikasi
pnpm dev
