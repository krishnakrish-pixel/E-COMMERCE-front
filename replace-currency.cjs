const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'src', 'app'));
const tsxFiles = files.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

let totalReplaced = 0;

tsxFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace $> {someVar.toFixed(2)} with ₹> {someVar.toFixed(2)}
  // E.g., >${product.price.toFixed(2)} -> >₹{product.price.toFixed(2)}
  content = content.replace(/>\$\{/g, '>₹{');
  
  // Replace >${number} -> >₹{number} (not template string, just jsx)
  // Wait, in JSX it's >$100</p>
  content = content.replace(/>\$([0-9]+)/g, '>₹$1');

  // Replace span>${var} -> span>₹{var}
  content = content.replace(/>\$\{/g, '>₹{'); // already did this but just in case
  
  // Replace Template Strings `... $${var.toFixed(2)}` -> `... ₹${var.toFixed(2)}`
  // Wait, in `... $${var.toFixed(2)}`, the first $ is the literal.
  // Actually regex for literal $ followed by ${ in template strings:
  content = content.replace(/\$\$\{/g, '₹${');
  
  // Specific cases found in the logs:
  content = content.replace(/>\$\{(item\.price \* item\.quantity)\.toFixed\(2\)\}/g, '>₹{(item.price * item.quantity).toFixed(2)}');
  content = content.replace(/>\$\{item\.price\.toFixed\(2\)\}/g, '>₹{item.price.toFixed(2)}');
  content = content.replace(/>\$\{getCartTotal\(\)\.toFixed\(2\)\}/g, '>₹{getCartTotal().toFixed(2)}');
  content = content.replace(/>\$\{\(getCartTotal\(\) \* 0\.1\)\.toFixed\(2\)\}/g, '>₹{(getCartTotal() * 0.1).toFixed(2)}');
  content = content.replace(/Add \$\{\(100 - getCartTotal\(\)\)\.toFixed\(2\)\}/g, 'Add ₹{(100 - getCartTotal()).toFixed(2)}');
  
  content = content.replace(/>\$\{subtotal\.toFixed\(2\)\}/g, '>₹{subtotal.toFixed(2)}');
  content = content.replace(/>\$\{tax\.toFixed\(2\)\}/g, '>₹{tax.toFixed(2)}');
  content = content.replace(/>\$\{total\.toFixed\(2\)\}/g, '>₹{total.toFixed(2)}');
  content = content.replace(/>\$\{order\.total\.toFixed\(2\)\}/g, '>₹{order.total.toFixed(2)}');
  content = content.replace(/>\$\{order\.subtotal\.toFixed\(2\)\}/g, '>₹{order.subtotal.toFixed(2)}');
  content = content.replace(/>\$\{order\.tax\.toFixed\(2\)\}/g, '>₹{order.tax.toFixed(2)}');
  content = content.replace(/>\$\{product\.price\.toFixed\(2\)\}/g, '>₹{product.price.toFixed(2)}');
  content = content.replace(/>\$\{relatedProduct\.price\.toFixed\(2\)\}/g, '>₹{relatedProduct.price.toFixed(2)}');
  content = content.replace(/On orders over \$100/g, 'On orders over ₹100');
  content = content.replace(/\{getCartTotal\(\) >= 100 \? 'Free' : '\$9\.99'\}/g, "{getCartTotal() >= 100 ? 'Free' : '₹9.99'}");
  
  // Replace line 154 in Cart: `$` (lone $)
  // Wait, in Cart.tsx line 154: `$` before a new line
  content = content.replace(/\n\s*\$\n/g, '\n                    ₹\n');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
    totalReplaced++;
  }
});

console.log(`Total files updated: ${totalReplaced}`);
