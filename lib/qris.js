/**
 * Mahatma Academy - QRIS Dinamis & QR Code Engine
 * Menghasilkan string QRIS Dinamis standar Bank Indonesia (EMVCo)
 * dengan Tag 54 (Nominal) dan CRC16-CCITT yang valid secara otomatis.
 */

// Menghitung CRC16-CCITT (Polynomial 0x1021, Initial 0xFFFF)
export function calculateCRC16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                crc = (crc << 1) & 0xFFFF;
            }
        }
    }
    let hex = (crc & 0xFFFF).toString(16).toUpperCase();
    return hex.padStart(4, '0');
}

/**
 * Mengubah string QRIS statis atau NMID menjadi string QRIS Dinamis dengan nominal pas
 * @param {string} qrisSource - String QRIS statis (000201...) ATAU kode NMID (ID10...)
 * @param {number} amount - Nominal pembayaran (misal 50000)
 * @returns {string} Payload string QRIS Dinamis siap scan
 */
export function generateDynamicQRIS(qrisSource, amount) {
    if (!qrisSource) return '';

    const cleanSource = qrisSource.trim();
    const nominal = Math.round(Number(amount) || 0);

    // Format Tag 54 untuk Nominal
    const amountStr = nominal.toString();
    const tag54 = nominal > 0 
        ? `54${String(amountStr.length).padStart(2, '0')}${amountStr}` 
        : '';

    // KASUS 1: Input merupakan string lengkap QRIS (berawalan 000201)
    if (cleanSource.startsWith('000201')) {
        // 1. Ubah Point of Initiation Method (Tag 01) dari '11' (Statis) ke '12' (Dinamis jika ada nominal)
        let qris = cleanSource;
        if (nominal > 0) {
            qris = qris.replace('010211', '010212');
        }

        // 2. Potong 4 karakter CRC lama di akhir string
        let baseQris = qris;
        const crcIndex = baseQris.lastIndexOf('6304');
        if (crcIndex !== -1) {
            baseQris = baseQris.substring(0, crcIndex);
        } else if (baseQris.length > 4) {
            baseQris = baseQris.slice(0, -4);
        }

        // 3. Masukkan Tag 54 jika ada nominal
        if (tag54) {
            // Cek apakah Tag 54 sudah ada sebelumnya
            if (baseQris.includes('54')) {
                baseQris = baseQris.replace(/54\d{2}\d+/, tag54);
            } else {
                // Sisipkan sebelum Tag 58 (Country Code) jika ada, atau di akhir
                const tag58Index = baseQris.indexOf('5802ID');
                if (tag58Index !== -1) {
                    baseQris = baseQris.slice(0, tag58Index) + tag54 + baseQris.slice(tag58Index);
                } else {
                    baseQris += tag54;
                }
            }
        }

        // 4. Tambahkan penutup Tag 6304 dan hitung CRC16 baru
        baseQris += '6304';
        const newCrc = calculateCRC16(baseQris);
        return baseQris + newCrc;
    }

    // KASUS 2: Input hanya berupa kode NMID (Contoh: ID1020304050607 atau 1020304050607)
    // Bangun payload standar QRIS Bank Indonesia dengan NMID tersebut
    let nmid = cleanSource.toUpperCase();
    if (!nmid.startsWith('ID')) {
        nmid = 'ID' + nmid;
    }

    // Tag 51 (Merchant Account Info QRIS) memuat NMID
    const nmidTag = `02${String(nmid.length).padStart(2, '0')}${nmid}`;
    const tag51Value = `0014ID.CO.QRIS.WWW${nmidTag}0303UMI`;
    const tag51 = `51${String(tag51Value.length).padStart(2, '0')}${tag51Value}`;

    // Susun payload QRIS EMVCo standar
    let payload = 
        "000201" +                          // Format Indicator
        (nominal > 0 ? "010212" : "010211") + // 12 = Dinamis, 11 = Statis
        tag51 +                             // Merchant NMID
        "52045499" +                         // Merchant Category Code (General)
        "5303360" +                          // Currency (360 = IDR)
        tag54 +                              // Tag 54: Nominal (jika ada)
        "5802ID" +                           // Country Code
        "5915MAHATMA ACADEMY" +              // Merchant Name
        "6007JAKARTA" +                      // Merchant City
        "610512340" +                        // Postal Code
        "62070703A01" +                      // Additional Data
        "6304";                              // Tag CRC

    const crc = calculateCRC16(payload);
    return payload + crc;
}

/**
 * Mendapatkan URL Gambar QR Code dari string payload
 * Menggunakan service QR Generator yang cepat, akurat dan mendukung payload panjang EMVCo
 */
export function getQRCodeImageUrl(payload, size = 320) {
    if (!payload) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=1&format=png&data=${encodeURIComponent(payload)}`;
}
