const express = require('express');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const CONFIG = require('./config.json');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/get-printer', (req, res) => {
    return res.status(200).json({ message: 'success', data: { name: CONFIG.printer_name } });
});

app.post('/print', async (req, res) => {
    const {storeName, phone, storeAddress, date, orderNumber, user, typeOrder, items, subtotal, tax, total, amount, paymentStatus} = req.body;
    
    const dateObj = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    const parsedTrxDate = `${day} ${month} ${year}`;
    const parsedTrxTime = dateObj.toTimeString().split(' ')[0];

    try {
	    let printerConfig = {
            type: PrinterTypes.EPSON,
            interface: `printer:${CONFIG.printer_name}`,
            driver: require('@thiagoelg/node-printer')
	    }

        if (CONFIG.paper_size === 48) {
            printerConfig['width'] = 30;
        }

	    let printer = new ThermalPrinter(printerConfig);

        const isConnected = await printer.isPrinterConnected();
        if (!isConnected) {
            console.error('Printer is not connected');
            return;
        }
        
        // Header
        printer.alignCenter();
        await printer.printImage('./assets/logo.png');
        // printer.println(\n${CONFIG.merchant_name});
	    printer.println(`\n${(storeName || '-')}`);
        // printer.println(${CONFIG.merchant_address});
	    printer.println(storeAddress || '-');
        // printer.println(${CONFIG.merchant_phone});
	    printer.println(phone || '-');

        // Order detail
        printer.drawLine();
        printer.tableCustom([
            { text: parsedTrxDate, align: "LEFT", width: 0.5 },
            { text: parsedTrxTime, align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Transaksi", align: "LEFT", width: 0.5 },
            { text: orderNumber || '-', align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Kasir", align: "LEFT", width: 0.5 },
            // { text: user, align: "RIGHT", width: 0.5 }
	    { text: '-', align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Pelanggan", align: "LEFT", width: 0.5 },
            { text: "-", align: "RIGHT", width: 0.5 }
        ]);

        // Trx type
        printer.drawLine();
        printer.println(typeOrder || '-');
        
        // Items
        printer.drawLine();
        items.forEach(product => {
            const { name, qty, price } = product;
	    const total = qty * price;
            printer.tableCustom([
                { text: `${(name || '-')}`, align: "LEFT", width: 0.5 },
                { text: " ", align: "RIGHT", width: 0.5 }
            ]);
            printer.tableCustom([
                { text: `${(qty || '0')}x ${(price || '0')}`, align: "LEFT", width: 0.5 },
                { text: total, align: "RIGHT", width: 0.5 }
            ]);

            // Spacer per item
            printer.tableCustom([
                { text: " ", align: "LEFT", width: 0.5 },
                { text: " ", align: "RIGHT", width: 0.5 }
            ]);
        });

        printer.drawLine();

        // Price
        printer.tableCustom([
            { text: "Subtotal", align: "LEFT", width: 0.5 },
            { text: subtotal || '0', align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Pajak (10%)", align: "LEFT", width: 0.5 },
            { text: tax || '0', align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Total", align: "LEFT", width: 0.5 },
            { text: total || '0', align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Tunai", align: "LEFT", width: 0.5 },
            { text: amount || '0', align: "RIGHT", width: 0.5 }
        ]);

        // Payment status
        printer.drawLine();
        printer.println(paymentStatus || '-');
        
        // Footer
        printer.drawLine();
        printer.println("Terima Kasih");

        printer.cut();
        const printResult = await printer.execute();
        console.log(`Print order: ${orderNumber} success:`, printResult);
        return res.status(200).json({ message: `Print order ${orderNumber} successful` });
    } catch (error) {
        console.error("Error printing receipt:", error);
        return res.status(500).json({ message: JSON.stringify(error) });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Printer server running on http://localhost:${PORT}`);
});