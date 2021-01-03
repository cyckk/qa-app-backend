import express from 'express';
import path from 'path';

const router = express.Router();

router.post('/pdf', (req, res) => {
  console.log('/api route ');
  const url = req.body.url;
  console.log(url);

  const pathToPdfs = path.join(__dirname, '../../public');
  console.log('pdf path ', pathToPdfs);

  (async () => {
    const puppeteer = require('puppeteer');

    const pageUrl = url;
    console.log(pageUrl);

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(pageUrl, {
        waitUntil: ['domcontentloaded', 'networkidle2'],
      });
      //   await page.emulateMedia('screen');
      const pdfPath = `${pathToPdfs}/report${Date.now()}.pdf`;
      await page.pdf({
        path: pdfPath, // path (relative to CWD) to save the PDF to.
        format: 'A4',
        printBackground: true, // print background colors
        width: '612px', // match the css width and height we set for our PDF
        height: '792px',
      });
      await browser.close();
      console.log('pdf generated at ', pdfPath);
      res.status(200).download(pdfPath, 'reportPdf.pdf', err => {
        if (!err) console.log('pdf sent');
      });
    } catch (err) {
      console.log('err ', err);
      res.status(500);
    }
  })();
});

export default router;
