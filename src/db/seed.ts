import { faker } from '@faker-js/faker';
import { users, restaurants, orderItems, orders, products, authLinks } from './schema';
import { db } from './connection';
import chalk from 'chalk';
import { createId } from '@paralleldrive/cuid2';


//Reset Database
await db.delete(users)
await db.delete(restaurants)
await db.delete(orderItems)
await db.delete(orders)
await db.delete(products)
await db.delete(authLinks)


console.log(chalk.yellow('✔️ Database Reset!'));


//Create Customers
const [customer1, customer2] = await db.insert(users).values([
    {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: 'customer',
    },
    {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: 'customer',
    },
]).returning()

console.log(chalk.yellow('✔️ Created Customers!'));


//Create Manager
const [manager] = await db.insert(users).values([
    {
        name: faker.person.fullName(),
        email: 'admin@admin.com',
        role: 'manager',
    }
]).returning({
    id: users.id
})

console.log(chalk.yellow('✔️ Created Manager!'));


//Create Restaurant
const [restaurant] = await db.insert(restaurants).values([
    {
        name: faker.company.name(),
        description: faker.lorem.paragraph(),
        managerId: manager.id
    }
]).returning()

console.log(chalk.yellow('✔️ Created Manager!'));

function generateProduct() {
    return {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        restaurantId: restaurant.id,
        priceInCents: Number(faker.commerce.price({ min: 190, max: 490, dec: 0 })),
    }
}

// Create Products
const availableProducts = await db.insert(products).values([
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
    generateProduct(),
]).returning()

console.log(chalk.yellow('✔️ Created Products!'));


// Create Orders

type OrderItemsInsert = typeof orderItems.$inferInsert
type OrdersInsert = typeof orders.$inferInsert

const orderItemsToInsert: OrderItemsInsert[] = []
const ordersToInsert: OrdersInsert[] = []

for (let i = 0; i < 200; i++) {
    const orderId = createId()

    const orderProducts = faker.helpers.arrayElements(availableProducts, {
        min: 1,
        max: 3,
    })

    let totalInCents = 0

    orderProducts.forEach(orderProducts => {
        const quantity = faker.number.int({ min: 1, max: 5 })
        totalInCents += orderProducts.priceInCents * quantity

        orderItemsToInsert.push({
            orderId,
            productId: orderProducts.id,
            priceInCents: orderProducts.priceInCents,
            quantity,
        })
    })

    ordersToInsert.push({
        id: orderId,
        customerId: faker.helpers.arrayElement([customer1.id, customer2.id]),
        restaurantId: restaurant.id,
        totalInCents,
        status: faker.helpers.arrayElement([
            'pending',
            'processing',
            'delivering',
            'delivered',
            'cancelled',
        ]),
        createdAt: faker.date.recent({ days: 40 })
    })
}

await db.insert(orders).values(ordersToInsert)
await db.insert(orderItems).values(orderItemsToInsert)

console.log(chalk.yellow('✔️ Created Orders!'));


console.log(chalk.greenBright('Seed applied successfully!'));

process.exit();