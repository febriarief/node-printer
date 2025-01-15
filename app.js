const express = require('express');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const CONFIG = require('./config.json');

const app = express();
const PORT = 3000;

// Middleware to parse JSON body
app.use(express.json());

let printerConfig = {
    type: PrinterTypes.EPSON,
    interface: `printer:${CONFIG.printer_name}`,
    driver: require('@thiagoelg/node-printer')
}

if (CONFIG.paper_size === 48) {
    printerConfig['width'] = 30;
}

let printer = new ThermalPrinter(printerConfig);

app.post('/print', async (req, res) => {
    const {trx_date, order_number, user, shipping_method, products, subtotal, tax, total, cash, payment_status} = req.body;
    
    const dateObj = new Date(trx_date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    const parsedTrxDate = `${day} ${month} ${year}`;
    const parsedTrxTime = dateObj.toTimeString().split(' ')[0];

    try {
        const isConnected = await printer.isPrinterConnected();
        if (!isConnected) {
            console.error('Printer is not connected');
            return;
        }
        
        // Header
        printer.alignCenter();
        await printer.printImage('./assets/logo.png');
        printer.println(`\n${CONFIG.merchant_name}`);
        printer.println(`${CONFIG.merchant_address}`);
        printer.println(`${CONFIG.merchant_phone}`);

        // Order detail
        printer.drawLine();
        printer.tableCustom([
            { text: parsedTrxDate, align: "LEFT", width: 0.5 },
            { text: parsedTrxTime, align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Transaksi", align: "LEFT", width: 0.5 },
            { text: order_number, align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Kasir", align: "LEFT", width: 0.5 },
            { text: user, align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Pelanggan", align: "LEFT", width: 0.5 },
            { text: "-", align: "RIGHT", width: 0.5 }
        ]);

        // Shipping method
        printer.drawLine();
        printer.println(shipping_method);
        
        // Items
        printer.drawLine();
        products.forEach(product => {
            const { name, variant, qty, price, total } = product;
            printer.tableCustom([
                { text: `${name} - ${variant}`, align: "LEFT", width: 0.5 },
                { text: " ", align: "RIGHT", width: 0.5 }
            ]);
            printer.tableCustom([
                { text: `${qty}x ${price}`, align: "LEFT", width: 0.5 },
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
            { text: subtotal, align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Pajak (10%)", align: "LEFT", width: 0.5 },
            { text: tax, align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Total", align: "LEFT", width: 0.5 },
            { text: total, align: "RIGHT", width: 0.5 }
        ]);
        printer.tableCustom([
            { text: "Tunai", align: "LEFT", width: 0.5 },
            { text: cash, align: "RIGHT", width: 0.5 }
        ]);

        // Payment status
        printer.drawLine();
        printer.println(payment_status);
        
        // Footer
        printer.drawLine();
        printer.println("Terima Kasih");

        printer.cut();
        const printResult = await printer.execute();
        console.log("Print success:", printResult);
        return res.status(200).json({ message: 'Print successful' });
    } catch (error) {
        console.error("Error printing receipt:", error);
        return res.status(500).json({ message: JSON.stringify(err) });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Printer server running on http://localhost:${PORT}`);
});