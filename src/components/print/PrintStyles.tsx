 import React from 'react';
 
 interface PrintStylesProps {
   paperSize: '80mm' | '58mm';
 }
 
 export function PrintStyles({ paperSize }: PrintStylesProps) {
   const width = paperSize === '80mm' ? '80mm' : '58mm';
   const fontSize = paperSize === '80mm' ? '11px' : '10px';
 
   return (
     <style>
       {`
         @media print {
           @page {
             size: ${width} auto;
             margin: 0;
           }
           
           html, body {
             width: ${width};
             margin: 0 !important;
             padding: 0 !important;
             font-size: ${fontSize};
             font-family: 'Courier New', Courier, monospace;
             -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
           }
           
           .print-container {
             width: 100%;
             padding: 4mm;
             box-sizing: border-box;
           }
           
           .print-header {
             text-align: center;
             border-bottom: 1px dashed #000;
             padding-bottom: 2mm;
             margin-bottom: 3mm;
           }
           
           .print-section {
             margin-bottom: 3mm;
             padding-bottom: 2mm;
             border-bottom: 1px dashed #000;
           }
           
           .print-item {
             margin-bottom: 2mm;
           }
           
           .print-row {
             display: flex;
             justify-content: space-between;
             line-height: 1.3;
           }
           
           .print-cut {
             border: none;
             border-top: 1px dashed #000;
             margin: 4mm 0;
           }
           
           .print-bold {
             font-weight: bold;
           }
           
           .print-large {
             font-size: 1.5em;
           }
           
           .print-small {
             font-size: 0.9em;
             color: #444;
           }
           
           .print-center {
             text-align: center;
           }
           
           .print-highlight {
             background: #eee;
             padding: 2mm;
             border: 1px solid #000;
           }
           
           .print-obs {
             background: #f5f5f5;
             padding: 2mm;
             margin-top: 2mm;
             border-left: 2px solid #000;
           }
           
           .no-print {
             display: none !important;
           }
         }
         
         @media screen {
           .print-container {
             max-width: 350px;
             margin: 0 auto;
             padding: 16px;
             background: white;
             font-family: 'Courier New', Courier, monospace;
             font-size: 12px;
             box-shadow: 0 2px 10px rgba(0,0,0,0.1);
           }
           
           .print-header {
             text-align: center;
             border-bottom: 1px dashed #ccc;
             padding-bottom: 8px;
             margin-bottom: 12px;
           }
           
           .print-section {
             margin-bottom: 12px;
             padding-bottom: 8px;
             border-bottom: 1px dashed #ccc;
           }
           
           .print-item {
             margin-bottom: 8px;
           }
           
           .print-row {
             display: flex;
             justify-content: space-between;
             line-height: 1.4;
           }
           
           .print-cut {
             border: none;
             border-top: 1px dashed #ccc;
             margin: 16px 0;
           }
           
           .print-bold {
             font-weight: bold;
           }
           
           .print-large {
             font-size: 1.5em;
           }
           
           .print-small {
             font-size: 0.9em;
             color: #666;
           }
           
           .print-center {
             text-align: center;
           }
           
           .print-highlight {
             background: #fffbeb;
             padding: 8px;
             border: 1px solid #f59e0b;
             border-radius: 4px;
           }
           
           .print-obs {
             background: #f5f5f5;
             padding: 8px;
             margin-top: 8px;
             border-left: 3px solid #333;
           }
         }
       `}
     </style>
   );
 }