const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

fs.readFile(manifestPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading AndroidManifest.xml:', err);
        process.exit(1);
    }

    // Check if permissions already exist to avoid duplication
    const permissions = [
        '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>',
        '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />'
    ];

    let updatedData = data;
    permissions.forEach(permission => {
        if (!data.includes(permission)) {
            updatedData = updatedData.replace(
                '</manifest>',
                `    ${permission}\n</manifest>`
            );
        }
    });

    fs.writeFile(manifestPath, updatedData, 'utf8', err => {
        if (err) {
            console.error('Error writing to AndroidManifest.xml:', err);
            process.exit(1);
        }
        console.log('AndroidManifest.xml updated successfully');
    });
});
