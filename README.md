# Backend code Lodigo

POSTMAN Collection -> https://api.postman.com/collections/27213613-43e0c244-ee8a-4e6c-a5a6-ab5da4a9bcd7?access_key=PMAT-01HPMGD72GCHV0RPGPJ4KQ5A2Y

## Steps to start server

### Development

#### NOTE: Start the redis server before starting the application

Clone this repository and move at desired path

```bash
git clone https://github.com/Kapilrohilla/lorrigo.git
mv lorrigo ~/yourpath
```

Create .env file using .env.example

```bash
cd lorrigo/
mv .env.example .env
vim .env
```

Install dependencies and start

```bash
npm install && npm run dev
```

##  Routes
1. /auth - authentication service - this service deals with signup, login apis
2. /vendor - service to add new logisitic vendor in our system
3. /getseller - api to fetch sellers in our system
4. /ratecalculator - api for logisitc transfer rate calculation
5. /hub - service to add hub in our system and register on other vendor platform. 
6. /order - service to deals with user orders
7. /shipment - service to process the orders and make and manage thier shipments 
