const express = require('express');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const CONFIG = require('./config.json');

const app = express();
const PORT = 3000;

app.use(express.json());

function formatToRupiah(amount) {
    amount = Number(amount);
	if (isNaN(amount)) return '-';
    const amountString = amount.toString();
    const split = amountString.split('').reverse().join('').match(/.{1,3}/g);
    const formatted = split.join('.').split('').reverse().join('');
    return 'Rp ' + formatted;
}

app.get('/get-printer', (req, res) => {
	return res.status(200).json({ message: 'success', data: { name: CONFIG.printer_name } });
});

app.post('/print', async (req, res) => {
	const {storeName, phone, storeAddress, date, orderNumber, receiver, name, tableNumber, typeOrder, items, subtotal, discount, taxName, tax, total, amount, paymentMethod, change, paymentStatus} = req.body;
	
	const dateObj = new Date(date);
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

	const day = String(dateObj.getDate()).padStart(2, '0');
	const month = months[dateObj.getMonth()];
	const year = dateObj.getFullYear();

	const parsedTrxDate = `${day} ${month} ${year}`;
	const parsedTrxTime = dateObj.toTimeString().split(' ')[0];

    let printerConfig = {
        type: PrinterTypes.EPSON,
        interface: `printer:${CONFIG.printer_name}`,
        driver: require('@thiagoelg/node-printer')
    }

    if (CONFIG.paper_size === 48) {
        printerConfig['width'] = 30;
    }

    let printer = new ThermalPrinter(printerConfig);

	try {
		const isConnected = await printer.isPrinterConnected();
		if (!isConnected) {
			console.error('Printer is not connected');
			printer.cut();
			return res.status(500).json({ message: `Print order ${orderNumber} Failed. Printer not connect.` });
		}
		
		// Header
		printer.alignCenter();
        await printer.printImage(CONFIG.merchant_logo);
		printer.println(``);
		printer.println(`${(storeName || '-')}`);
		printer.println(storeAddress || '-');
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
			{ text: receiver || '-', align: "RIGHT", width: 0.5 }
		]);
		printer.tableCustom([
			{ text: "ID Pelanggan", align: "LEFT", width: 0.5 },
			{ text: name || '-', align: "RIGHT", width: 0.5 }
		]);
		printer.tableCustom([
			{ text: "No Meja", align: "LEFT", width: 0.5 },
			{ text: tableNumber || '-', align: "RIGHT", width: 0.5 }
		]);

		// Trx type
		printer.drawLine();
		printer.println(typeOrder || '-');
		
		// Items
		printer.drawLine();
		(items || []).forEach(product => {
			const { name, qty, price, discount, variants, servers_ids } = product;
			const total = qty * price;
			printer.tableCustom([
				{ text: `${(qty || '0')}x `, align: "LEFT", width: 0.1 },
				{ text: `${name}`, align: "LEFT", width: 0.4 },
                { text: formatToRupiah(total), align: "RIGHT", width: 0.5 }
			]);
			
            printer.alignLeft();

            // Variants
            (variants || []).forEach(obj => {
                printer.println(`    ${obj.value} +${obj.price}`);
            });
            
            // PIC
            (servers_ids || []).forEach(obj => {
                printer.println(` -${obj.fulname}`);
            });

			// Discount
            (discount || []).forEach(obj => {    
                printer.tableCustom([
                    { text: obj.name, align: "LEFT", width: 0.5 },
                    { text: `-${formatToRupiah(obj.value)}`, align: "RIGHT", width: 0.5 }
                ]);
            });

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
			{ text: formatToRupiah(subtotal || 0), align: "RIGHT", width: 0.5 }
		]);
		
        (discount || []).forEach(obj => {    
            printer.tableCustom([
                { text: obj.name, align: "LEFT", width: 0.5 },
                { text: `-${formatToRupiah(obj.value)}`, align: "RIGHT", width: 0.5 }
            ]);
        });

		if (tax && Number(tax) !== 0) {
			printer.tableCustom([
				{ text: `${taxName}`, align: "LEFT", width: 0.5 },
				{ text: formatToRupiah(tax || 0), align: "RIGHT", width: 0.5 }
			]);
		}
		
		printer.tableCustom([
			{ text: "Total", align: "LEFT", width: 0.5 },
			{ text: formatToRupiah(total || 0), align: "RIGHT", width: 0.5 }
		]);

		printer.tableCustom([
			{ text: paymentMethod, align: "LEFT", width: 0.5 },
			{ text: formatToRupiah(amount || 0), align: "RIGHT", width: 0.5 }
		]);

		printer.drawLine();
		printer.tableCustom([
			{ text: 'Kembalian', align: "LEFT", width: 0.5 },
			{ text: formatToRupiah(change || 0), align: "RIGHT", width: 0.5 }
		]);

		printer.drawLine();
        printer.alignCenter();
		printer.println(paymentStatus || '-');
		
		// Footer
		printer.drawLine();
		printer.println(CONFIG.footer);

		printer.cut();
		const printResult = await printer.execute();
		console.log(`Print order: ${orderNumber} success:`, printResult);
		return res.status(200).json({ message: `Print order ${orderNumber} successful` });
	} catch (error) {
		console.error("Error printing receipt:", error);
		printer.cut();
		return res.status(500).json({ message: JSON.stringify(error) });
	}
});

// Start the server
app.listen(PORT, () => {
	console.log(`Printer server running on http://localhost:${PORT}`);
});
