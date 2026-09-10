import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LLD Practice Platform database...');

  // 1. Seed Rubric v1
  const existingRubric = await prisma.rubric.findUnique({
    where: { version: 1 },
  });

  if (!existingRubric) {
    console.log('Creating Rubric v1 with 8 canonical criteria...');
    await prisma.rubric.create({
      data: {
        version: 1,
        title: 'Core LLD Design Evaluation Rubric v1',
        description:
          'Comprehensive rubric assessing requirement understanding, class responsibilities, SOLID principles, extensibility, testability, and design reasoning.',
        isDefault: true,
        criteria: {
          create: [
            {
              criterionKey: 'REQUIREMENT_UNDERSTANDING',
              name: 'Requirement Understanding & Scope',
              description:
                'Demonstrates clear identification of functional requirements, assumptions, actors, and system boundaries without missing core user stories.',
              weight: 0.1,
              appliesToFormat: ['TEXT', 'CODE'],
            },
            {
              criterionKey: 'CLASS_RESPONSIBILITIES',
              name: 'Class & Interface Responsibilities (SRP)',
              description:
                'Entities, controllers, and services possess single, well-defined responsibilities. No god-classes, clean separation of concerns.',
              weight: 0.15,
              appliesToFormat: ['TEXT', 'CODE'],
            },
            {
              criterionKey: 'COUPLING_COHESION',
              name: 'Coupling & Cohesion',
              description:
                'High cohesion within modules, low coupling across components. Proper use of dependency injection and interfaces rather than concrete implementations.',
              weight: 0.15,
              appliesToFormat: ['TEXT', 'CODE'],
            },
            {
              criterionKey: 'ENCAPSULATION_INTERFACE_DESIGN',
              name: 'Encapsulation & Interface Design',
              description:
                'Internal state is well encapsulated. Public APIs and method signatures are clean, intention-revealing, and prevent unauthorized state mutation.',
              weight: 0.1,
              appliesToFormat: ['TEXT', 'CODE'],
            },
            {
              criterionKey: 'ABSTRACTION_AND_PATTERNS',
              name: 'Appropriate Use of Abstraction & Patterns',
              description:
                'Design patterns (Strategy, Factory, Observer, State, etc.) are applied judiciously where warranted, avoiding premature over-engineering.',
              weight: 0.15,
              appliesToFormat: ['TEXT', 'CODE'],
            },
            {
              criterionKey: 'EXTENSIBILITY',
              name: 'Extensibility to Changing Requirements',
              description:
                'System is easily extensible to new types, rules, algorithms, or payment methods with minimal modifications to existing code (OCP).',
              weight: 0.15,
              appliesToFormat: ['TEXT', 'CODE'],
            },
            {
              criterionKey: 'EDGE_CASES_TESTABILITY',
              name: 'Edge Cases & Testability',
              description:
                'Handles concurrency, boundary conditions, empty inputs, resource exhaustion, and allows straightforward unit/mock testing.',
              weight: 0.1,
              appliesToFormat: ['TEXT', 'CODE'],
            },
            {
              criterionKey: 'EXPLANATION_QUALITY',
              name: 'Quality of Explanation & Reasoning',
              description:
                'Clear rationale provided for architectural choices, trade-offs accepted, and intentional omissions as documented in designRationale.',
              weight: 0.1,
              appliesToFormat: ['TEXT', 'CODE'],
            },
          ],
        },
      },
    });
  }

  // 2. Seed 5 Classic LLD Problems
  const problems = [
    {
      slug: 'parking-lot',
      title: 'Design a Multi-Floor Parking Lot System',
      description:
        'Design an automated multi-floor parking lot management system capable of assigning slots, tracking vehicle occupancy, issuing tickets at entry gates, and calculating parking fees dynamically at exit gates.',
      difficulty: 'MEDIUM',
      tags: ['Object-Oriented Design', 'Strategy Pattern', 'State Management', 'Concurrency'],
      functionalRequirements: [
        'Support multiple vehicle types: Motorcycle/Scooter, Compact Car, Large SUV/Truck, and Electric Vehicle (EV).',
        'Support multiple floors with dedicated slots categorized by vehicle size and charging availability.',
        'Issue an entry ticket with slot ID, timestamp, and barcode upon vehicle arrival at an entry gate.',
        'Dynamically assign the nearest available valid slot to optimize vehicle entry flow.',
        'Calculate parking fee upon exit based on vehicle type and duration using swappable pricing strategies (e.g., hourly flat rate, slab-based, peak-hour surge).',
        'Support multiple payment methods (Cash, Card, UPI) and mark slot as freed immediately upon payment.',
      ],
      nonFunctionalRequirements: [
        'Thread-safe slot allocation to prevent double-booking under concurrent entry gates.',
        'Low-latency slot availability queries for real-time display boards on each floor.',
        'High modularity allowing addition of new vehicle types or payment gateways without code changes.',
      ],
      constraints: [
        'A large vehicle cannot park in a compact slot; compact vehicles can park in large slots only if designated by policy.',
        'Only 1 vehicle per designated parking spot.',
        'Parking lot capacity is fixed per floor.',
      ],
      expectedFormat: 'BOTH',
    },
    {
      slug: 'elevator-system',
      title: 'Design an Elevator Management System',
      description:
        'Design an intelligent elevator dispatch and control system for a modern high-rise skyscraper with multiple elevator cars operating concurrently.',
      difficulty: 'HARD',
      tags: ['State Pattern', 'Scheduling Algorithms', 'Concurrency', 'Strategy Pattern'],
      functionalRequirements: [
        'Control N elevator cars across M floors (e.g., 4 elevators serving 30 floors).',
        'Process internal requests (passenger inside elevator presses floor button).',
        'Process external hall requests (passenger on floor presses UP or DOWN call button).',
        'Support swappable dispatch algorithms (LOOK / SCAN elevator scheduling, Nearest-Car-First, Energy-efficient).',
        'Handle door states (OPEN, CLOSING, CLOSED) and elevator motion states (IDLE, MOVING_UP, MOVING_DOWN, MAINTENANCE).',
        'Emergency stop button and overload sensor alarms.',
      ],
      nonFunctionalRequirements: [
        'Thread-safe request queueing across concurrent floor requests.',
        'Fairness to prevent elevator starvation for passengers on intermediate floors.',
        'Graceful degradation: an elevator in maintenance is skipped by the dispatcher.',
      ],
      constraints: [
        'Maximum weight capacity per elevator car (e.g., 1000 kg or 12 passengers).',
        'Elevators must come to a complete stop before doors open.',
      ],
      expectedFormat: 'BOTH',
    },
    {
      slug: 'vending-machine',
      title: 'Design a Smart Vending Machine',
      description:
        'Design a stateful vending machine software controller that accepts currency/card payments, manages inventory across product racks, dispenses items, and returns exact change.',
      difficulty: 'EASY',
      tags: ['State Pattern', 'Inventory Management', 'Finite State Machine'],
      functionalRequirements: [
        'Support multiple states: Idle/Ready, AcceptingMoney, ProductSelected, Dispensing, ReturningChange, OutOfService.',
        'Allow customer to insert coins and bills of standard denominations, tracking current balance.',
        'Allow customer to select product by rack code (e.g., A1, B3).',
        'Validate sufficient balance and stock before initiating dispensing.',
        'Dispense selected item and calculate/dispense exact change.',
        'Allow cancellation at any point before dispensing, refunding inserted funds.',
        'Admin mode to restock products and refill cash reserves.',
      ],
      nonFunctionalRequirements: [
        'Strict state encapsulation — invalid transitions (e.g., dispensing when no money inserted) must be prevented by the state objects.',
        'Accurate ledger accounting for cash held in the machine register.',
      ],
      constraints: [
        'Exact change can only be dispensed if the machine has appropriate coin denominations.',
        'Product rack capacity is limited.',
      ],
      expectedFormat: 'BOTH',
    },
    {
      slug: 'library-management-system',
      title: 'Design a Library Management System',
      description:
        'Design a comprehensive digital library catalog and circulation system managing book inventory, barcode scanning, borrowing limits, reservations, and overdue fine calculations.',
      difficulty: 'MEDIUM',
      tags: ['Domain Modeling', 'Fine Strategy', 'Observer Pattern', 'Search & Filtering'],
      functionalRequirements: [
        'Book catalog management: Book entity with metadata (ISBN, Title, Authors, Subject) and individual physical BookCopy items with barcodes and rack location.',
        'Member management: Students, Faculty, and Guests with different borrowing privileges (max books allowed, loan duration in days).',
        'Check-out and check-in workflows updating book copy status (AVAILABLE, LOANED, RESERVED, LOST).',
        'Book reservation queue when all copies of a title are currently loaned out.',
        'Automated fine calculation for overdue items based on member type and days past due date.',
        'Multi-attribute search: search by title, author, category, or ISBN.',
      ],
      nonFunctionalRequirements: [
        'Auditable transaction history for every checkout, renewal, and return.',
        'Extensible fine strategy (e.g., grace periods, standard daily fines, lost book replacement fee).',
      ],
      constraints: [
        'A member with outstanding unpaid fines exceeding threshold cannot borrow new books.',
        'A borrowed book can only be renewed if no other member has placed an active reservation.',
      ],
      expectedFormat: 'BOTH',
    },
    {
      slug: 'ride-sharing-service',
      title: 'Design a Ride-Sharing Service (Uber / Lyft)',
      description:
        'Design the core low-level domain architecture for an on-demand ride-hailing platform connecting riders with nearby drivers, estimating fares, managing trip states, and processing payments.',
      difficulty: 'HARD',
      tags: ['Observer Pattern', 'Strategy Pattern', 'State Machine', 'Spatial Matching'],
      functionalRequirements: [
        'Rider requests a ride specifying pickup and drop-off coordinates, vehicle tier (UberX, Comfort, Black, XL).',
        'Driver matching engine: Finds eligible nearby drivers within radius and offers trip with timeout.',
        'Trip lifecycle state machine: REQUESTED -> DRIVER_ASSIGNED -> DRIVER_ARRIVED -> IN_TRIP -> COMPLETED -> CANCELLED.',
        'Dynamic fare calculation strategy considering base fare, distance, duration, vehicle tier, and surge multiplier.',
        'Driver rating and rider feedback upon trip completion.',
        'Cancellation policy with fee attribution based on elapsed time since dispatch.',
      ],
      nonFunctionalRequirements: [
        'High concurrency: Atomic driver acceptance to ensure a trip is never assigned to two drivers simultaneously.',
        'Pluggable pricing strategies and payment provider integrations (Stripe, PayPal, Wallet).',
        'Observer pattern for status updates notifying riders and drivers in real time.',
      ],
      constraints: [
        'A driver can only be on one active trip at a time.',
        'Surge multiplier must have an upper bound guardrail.',
      ],
      expectedFormat: 'BOTH',
    },
  ];

  for (const prob of problems) {
    await prisma.problem.upsert({
      where: { slug: prob.slug },
      update: prob,
      create: prob,
    });
    console.log(`Seeded problem: ${prob.title} (${prob.slug})`);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

