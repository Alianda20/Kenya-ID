import jsPDF from 'jspdf';

interface WaitingCardData {
  applicationNumber: string;
  fullName: string;
  district: string;
  applicationType: string;
  officerName: string;
  date: string;
}

export const generateWaitingCard = (data: WaitingCardData) => {
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  
  // Header section
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.applicationNumber, 280, 15, { align: 'right' });
  pdf.setFontSize(10);
  pdf.text('SERIAL NO.', 280, 20, { align: 'right' });
  
  // Main title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('REPUBLIC OF KENYA', 148, 35, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('THE REGISTRATION OF PERSONS ACT (CAP. 107)', 148, 45, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('APPLICATION FOR REGISTRATION ACKNOWLEDGEMENT', 148, 55, { align: 'center' });
  
  // Draw main border
  pdf.rect(20, 70, 256, 130);
  
  // Left column
  const leftX = 30;
  const rightX = 160;
  let leftY = 85;
  let rightY = 85;
  const lineHeight = 15;
  
  pdf.setFontSize(11);
  
  // Left side - Personal details
  pdf.setFont('helvetica', 'bold');
  pdf.text('1. Misc. Receipt No.', leftX, leftY);
  leftY += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.applicationNumber, leftX + 5, leftY);
  leftY += lineHeight;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('2. Office of Issue', leftX, leftY);
  leftY += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.district, leftX + 5, leftY);
  leftY += lineHeight;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('3. Full names', leftX, leftY);
  leftY += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.fullName, leftX + 5, leftY);
  leftY += lineHeight;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('4. Home district', leftX, leftY);
  leftY += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.district, leftX + 5, leftY);
  leftY += lineHeight;
  
  // Right side - Application details and signatures
  pdf.setFont('helvetica', 'bold');
  pdf.text('5. Type of Application', rightX, rightY);
  rightY += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.applicationType, rightX + 5, rightY);
  rightY += lineHeight;
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('6. Address', rightX, rightY);
  rightY += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text('________________________', rightX + 5, rightY);
  rightY += lineHeight;
  
  // Signature and date section
  pdf.setFont('helvetica', 'bold');
  pdf.text('Signature', rightX, rightY);
  pdf.text('Date', rightX + 60, rightY);
  rightY += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text('_________________', rightX, rightY);
  pdf.text(data.date, rightX + 60, rightY);
  rightY += 15;
  
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(9);
  pdf.text('This acknowledgement is not an', rightX, rightY);
  rightY += 5;
  pdf.text('identity card', rightX, rightY);
  
  // Officer details at bottom
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('7. Name of Registration Officer', leftX, 175);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.officerName, leftX + 5, 185);
  
  // Thumbprint area
  pdf.setFont('helvetica', 'bold');
  pdf.text('Thumbprint', rightX + 80, 175);
  pdf.rect(rightX + 80, 180, 30, 20); // Thumbprint box
  
  // Save the PDF
  const fileName = `application-${data.applicationNumber}.pdf`;
  pdf.save(fileName);
  
  return fileName;
};