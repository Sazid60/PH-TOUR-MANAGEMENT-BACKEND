/* eslint-disable @typescript-eslint/no-explicit-any */
import PDFDocument from "pdfkit";
import AppError from "../errorHelpers/AppError";

export interface IInvoiceData {
    transactionId: string;
    bookingDate: Date;
    userName: string;
    tourTitle: string;
    guestCount: number;
    totalAmount: number;
}

export const generatePdf = async (invoiceData: IInvoiceData) : Promise<Buffer<ArrayBufferLike>>=> {
    try {
        // being async function we have explicitly used Promise here because we are using stream system to load the data. 


        // async/await works only with functions that already return a promise.
        // doc.on("end", ...) is callback-style, so you must manually wrap it in a Promise to make it await-compatible.
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: "A4", margin: 50 }) 
            // Creates a new PDFDocument instance (PDFKit). Not explaining PDFKit specifics.
            const buffer: Uint8Array[] = []; 
            //Creates an array named buffer to temporarily store chunks of binary data emitted by the PDF generator.
            // here we are taking an array of buffer which is a type of  UNit8Array[] made for buffer 
            // in this array we will store the buffered data in chunk by chunk


            doc.on("data", (chunk) => buffer.push(chunk)) 
            // wEvery time the document emits a "data" event (a chunk of PDF bytes), push it into buffer.
            doc.on("end", () => resolve(Buffer.concat(buffer)))
            //when all chunks are loaded we will concat the chunks and add it taking from the buffer.
            //here big B buffer is coming from javascript its grabbing the buffer array
            // Concatenate all chunks from buffer into a single Buffer,
            doc.on("error", (err) => reject(err))

            //PDF Content
            doc.fontSize(20).text("Invoice", { align: "center" });
            doc.moveDown()
            doc.fontSize(14).text(`Transaction ID : ${invoiceData.transactionId}`)
            doc.text(`Booking Date : ${invoiceData.bookingDate}`)
            doc.text(`Customer : ${invoiceData.userName}`)

            doc.moveDown();
            doc.text(`Tour: ${invoiceData.tourTitle}`);
            doc.text(`Guests: ${invoiceData.guestCount}`);
            doc.text(`Total Amount: $${invoiceData.totalAmount.toFixed(2)}`);
            doc.moveDown();

            doc.text("Thank you for booking with us!", { align: "center" });
            doc.end()

        })

    } catch (error: any) {
        console.log(error);
        throw new AppError(401, `Pdf creation error ${error.message}`)
    }
}