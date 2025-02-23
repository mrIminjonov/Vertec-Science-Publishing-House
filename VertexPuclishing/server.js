const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // Import UUID for unique IDs

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure journals directory exists
const journalsDir = path.join(__dirname, 'journals');
if (!fs.existsSync(journalsDir)) {
    fs.mkdirSync(journalsDir, { recursive: true });
}

// Ensure images directory exists
const imagesDir = path.join(__dirname, 'journals', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Ensure files directory exists
const filesDir = path.join(__dirname, 'journals', 'files');
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
}

// Set up storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'imageFile') {
            cb(null, path.join(__dirname, 'journals', 'images'));
        } else if (file.fieldname === 'fileFile') {
            cb(null, path.join(__dirname, 'journals', 'files'));
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from the root directory
app.use('/login', express.static(path.join(__dirname, 'login'))); // Serve static files from the login directory

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

app.get('/main2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'main2.html'));
});

app.post('/register', (req, res) => {
    const userData = req.body;
    const filePath = path.join(__dirname, 'user.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        let users = [];
        if (!err && data) {
            try {
                users = JSON.parse(data);
            } catch (parseErr) {
                console.error('Error parsing user data', parseErr);
                return res.status(500).json({ message: 'Internal Server Error' });
            }
        }

        // Check if the user already exists
        const userExists = users.find(user => user.email === userData.email || user.username === userData.username);
        if (userExists) {
            return res.status(400).json({ message: 'User already registered' });
        }

        users.push(userData);

        fs.writeFile(filePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error('Error writing to file', err);
                res.status(500).json({ message: 'Internal Server Error' });
            } else {
                res.status(200).json({ message: 'User data saved successfully' });
            }
        });
    });
});

app.post('/login', (req, res) => {
    const loginData = req.body;
    const filePath = path.join(__dirname, 'user.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file', err);
            res.status(500).json({ message: 'Internal Server Error' });
            return;
        }

        try {
            const users = JSON.parse(data);
            const user = users.find(user => (user.email === loginData.email || user.username === loginData.username) && user.password === loginData.password);

            if (user) {
                res.status(200).json({ message: 'Login successful', user });
            } else {
                res.status(401).json({ message: 'Invalid email/username or password' });
            }
        } catch (parseErr) {
            console.error('Error parsing user data', parseErr);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });
});

// Serve main2.html after successful registration or login
app.get('/main2.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'main2.html'));
});

// New Endpoint - Upload Admin Journal
app.post('/uploadAdminJournal', upload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'fileFile', maxCount: 1 }]), (req, res) => {
    const journalId = uuidv4(); // Generate a unique ID for the journal
    const imageFile = req.files['imageFile'][0];
    const fileFile = req.files['fileFile'][0];

    const journal = {
        id: journalId,
        journalName: req.body.journalName,
        description: req.body.description,
        issn: req.body.issn,
        imagePath: path.join('journals', 'images', imageFile.filename),
        filePath: path.join('journals', 'files', fileFile.filename),
        publishedAt: new Date().toISOString()
    };
    const filePath = path.join(__dirname, 'journals', 'adminadd.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        let journals = [];
        if (!err) {
            try {
                if (data) {
                    journals = JSON.parse(data);
                }
            } catch (parseErr) {
                console.error('Error parsing admin journals', parseErr);
                return res.status(500).json({ success: false, message: 'Error parsing journal data' });
            }
        } else if (err.code !== 'ENOENT') {
            console.error('Error reading admin journals file', err);
            return res.status(500).json({ success: false, message: 'Error reading journal data' });
        }

        journals.push(journal);
        fs.writeFile(filePath, JSON.stringify(journals, null, 2), (err) => {
            if (err) {
                console.error('Error writing admin journals file', err);
                return res.status(500).json({ success: false, message: 'Error writing to file' });
            }
            // Respond with JSON true
            res.json({ success: true, message: 'Journal published successfully!' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
