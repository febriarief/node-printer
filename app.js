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
	const {storeName, phone, storeAddress, date, orderNumber, receiver, name, typeOrder, items, subtotal, disc, tax, total, amount, paymentMethod, change, paymentStatus} = req.body;
	
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
			printer.cut();
			return res.status(500).json({ message: `Print order ${orderNumber} Failed. Printer not connect.` });
		}
		
		// Header
		printer.alignCenter();
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
			{ text: "Pelanggan", align: "LEFT", width: 0.5 },
			{ text: name || '-', align: "RIGHT", width: 0.5 }
		]);

		// Trx type
		printer.drawLine();
		printer.println(typeOrder || '-');
		
		// Items
		printer.drawLine();
		(items || []).forEach(product => {
			const { name, qty, price, discount, discount_type } = product;
			const total = qty * price;
			printer.tableCustom([
				{ text: `${(name || '-')}`, align: "LEFT", width: 0.5 },
				{ text: " ", align: "RIGHT", width: 0.5 }
			]);
			printer.tableCustom([
				{ text: `${(qty || '0')}x ${formatToRupiah(price || 0)}`, align: "LEFT", width: 0.5 },
				{ text: formatToRupiah(total), align: "RIGHT", width: 0.5 }
			]);
			
			// Discount
			if (discount && discount !== "") {
				let discText = `Diskon ${discount} ${discount_type === 'percent' ? '%' : ''}`;
				let discValue = 0;
				if (discount_type === 'percent') {
					discText = `Diskon ${discount}%`;
					discValue = Number(price) - (Number(discount) / 100 * Number(price));
				} else {
					discText = `Diskon ${discount}`;
					discValue = Number(price) - Number(discount);
				}

				printer.tableCustom([
					{ text: discText, align: "LEFT", width: 0.5 },
					{ text: formatToRupiah(discValue), align: "RIGHT", width: 0.5 }
				]);
			}

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
		
		if (disc && Number(disc) !== 0) {
			printer.tableCustom([
				{ text: "Diskon", align: "LEFT", width: 0.5 },
				{ text: formatToRupiah(disc || 0), align: "RIGHT", width: 0.5 }
			]);
		}

		if (tax && Number(tax) !== 0) {
			printer.tableCustom([
				{ text: "Pajak (10%)", align: "LEFT", width: 0.5 },
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
