import {Link,useParams} from 'react-router-dom';

const pages={
  about:['About SBN Kirana','SBN Kirana is built as a modern neighbourhood grocery shopping experience focused on convenience, clear pricing and dependable local service.'],
  'work-with-us':['Work With Us','Interested in joining store operations, delivery, support or management? Use our contact form and select Work With Us in your message.'],
  business:['Business & Bulk Supply','We support recurring grocery requirements for offices, shops and local businesses. Contact us with your product list and expected order frequency.'],
  dealers:['Dealers & Distributors','Dealers and distributors can contact SBN Kirana to discuss product supply, pricing, availability and long-term business opportunities.'],
  shipping:['Delivery Information','Delivery timing, charges and service availability depend on the delivery area and order value. Orders above the displayed free-delivery threshold qualify when available.'],
  refund:['Refund Policy','If an item is damaged, incorrect, expired or materially different from the order, contact support promptly with order details. Eligible refunds or replacements are reviewed against the order record and product condition.'],
  help:['Help Center','For order, account, product, delivery or PayLater assistance, contact our support team through the website Contact page.'],
  terms:['Terms & Conditions','By using SBN Kirana you agree to provide accurate account and delivery information, use the service lawfully, and pay amounts due for confirmed purchases. Product availability and delivery estimates may change.'],
  privacy:['Privacy Policy','Account and order information is used to operate the store, fulfil orders and provide support. Access should be limited to authorized store personnel and service providers needed to operate the platform.'],
  'paylater-terms':['PayLater Terms','SBN PayLater is a store-credit feature available only after manual approval by store management. Approved limit, outstanding balance and due date are shown in your account. It is not an automatic credit-scoring service.'],
  'responsible-credit':['Responsible Credit','Use PayLater only for purchases you can repay by the shown due date. Store management may reduce, block or close PayLater access when necessary.'],
  'bulk-orders':['Bulk Orders','For larger household, event or business orders, send your item list, quantities and preferred fulfilment date through Contact.'],
  suppliers:['Become a Supplier','Suppliers can share their catalogue, price list and supply terms through our business contact channel.'],
  corporate:['Corporate Supply','SBN Kirana can support recurring pantry and grocery requirements for teams and local organizations, subject to availability.'],
  advertise:['Advertise With Us','Brands and local businesses can contact management about relevant on-site promotional opportunities.']
};

export default function InfoPage(){const {slug}=useParams();const [title,text]=pages[slug]||['Information','This information page is being updated.'];return <main className="info-page"><div className="info-card"><span className="eyebrow">SBN KIRANA</span><h1>{title}</h1><p>{text}</p><p>For specific questions, business proposals or support requests, contact store management directly.</p><Link className="primary" to="/contact">Contact SBN Kirana →</Link></div></main>}
