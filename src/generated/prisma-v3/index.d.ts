
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Inquiry
 * 
 */
export type Inquiry = $Result.DefaultSelection<Prisma.$InquiryPayload>
/**
 * Model ServiceType
 * 
 */
export type ServiceType = $Result.DefaultSelection<Prisma.$ServiceTypePayload>
/**
 * Model PricingOption
 * 
 */
export type PricingOption = $Result.DefaultSelection<Prisma.$PricingOptionPayload>
/**
 * Model PricingRule
 * 
 */
export type PricingRule = $Result.DefaultSelection<Prisma.$PricingRulePayload>
/**
 * Model Quote
 * 
 */
export type Quote = $Result.DefaultSelection<Prisma.$QuotePayload>
/**
 * Model QuoteLineItem
 * 
 */
export type QuoteLineItem = $Result.DefaultSelection<Prisma.$QuoteLineItemPayload>
/**
 * Model QuoteAdjustment
 * 
 */
export type QuoteAdjustment = $Result.DefaultSelection<Prisma.$QuoteAdjustmentPayload>
/**
 * Model PaymentPlan
 * 
 */
export type PaymentPlan = $Result.DefaultSelection<Prisma.$PaymentPlanPayload>
/**
 * Model ContractDraft
 * 
 */
export type ContractDraft = $Result.DefaultSelection<Prisma.$ContractDraftPayload>
/**
 * Model LegacyImportLog
 * 
 */
export type LegacyImportLog = $Result.DefaultSelection<Prisma.$LegacyImportLogPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const ClientType: {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY'
};

export type ClientType = (typeof ClientType)[keyof typeof ClientType]


export const InquiryType: {
  FOREIGNER_VISA: 'FOREIGNER_VISA',
  IMMIGRATION_STAY: 'IMMIGRATION_STAY',
  APOSTILLE_CONSULAR: 'APOSTILLE_CONSULAR',
  TRANSLATION_NOTARY: 'TRANSLATION_NOTARY',
  GENERAL_ADMIN_CIVIL: 'GENERAL_ADMIN_CIVIL',
  CORPORATE_REQUEST: 'CORPORATE_REQUEST',
  UNKNOWN: 'UNKNOWN'
};

export type InquiryType = (typeof InquiryType)[keyof typeof InquiryType]


export const InquiryStatus: {
  NEW: 'NEW',
  IN_REVIEW: 'IN_REVIEW',
  WAITING_CONSULTATION: 'WAITING_CONSULTATION',
  QUOTE_SENT: 'QUOTE_SENT',
  WON: 'WON',
  CLOSED: 'CLOSED'
};

export type InquiryStatus = (typeof InquiryStatus)[keyof typeof InquiryStatus]


export const UrgencyLevel: {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export type UrgencyLevel = (typeof UrgencyLevel)[keyof typeof UrgencyLevel]


export const LanguageCode: {
  KO: 'KO',
  EN: 'EN',
  AR: 'AR'
};

export type LanguageCode = (typeof LanguageCode)[keyof typeof LanguageCode]


export const PricingOptionType: {
  FLAT: 'FLAT',
  PERCENT: 'PERCENT'
};

export type PricingOptionType = (typeof PricingOptionType)[keyof typeof PricingOptionType]


export const PricingRuleType: {
  URGENCY: 'URGENCY',
  CONSULT: 'CONSULT',
  PAYMENT: 'PAYMENT',
  POLICY: 'POLICY'
};

export type PricingRuleType = (typeof PricingRuleType)[keyof typeof PricingRuleType]


export const QuoteStatus: {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  CONTRACT_DRAFTED: 'CONTRACT_DRAFTED',
  ARCHIVED: 'ARCHIVED'
};

export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus]


export const QuoteLineKind: {
  SERVICE: 'SERVICE',
  URGENCY: 'URGENCY',
  MANUAL: 'MANUAL'
};

export type QuoteLineKind = (typeof QuoteLineKind)[keyof typeof QuoteLineKind]


export const PaymentStageKind: {
  RETAINER: 'RETAINER',
  MIDTERM: 'MIDTERM',
  SUCCESS: 'SUCCESS'
};

export type PaymentStageKind = (typeof PaymentStageKind)[keyof typeof PaymentStageKind]


export const ContractDraftStatus: {
  DRAFT: 'DRAFT',
  FINALIZED: 'FINALIZED',
  VOID: 'VOID'
};

export type ContractDraftStatus = (typeof ContractDraftStatus)[keyof typeof ContractDraftStatus]

}

export type ClientType = $Enums.ClientType

export const ClientType: typeof $Enums.ClientType

export type InquiryType = $Enums.InquiryType

export const InquiryType: typeof $Enums.InquiryType

export type InquiryStatus = $Enums.InquiryStatus

export const InquiryStatus: typeof $Enums.InquiryStatus

export type UrgencyLevel = $Enums.UrgencyLevel

export const UrgencyLevel: typeof $Enums.UrgencyLevel

export type LanguageCode = $Enums.LanguageCode

export const LanguageCode: typeof $Enums.LanguageCode

export type PricingOptionType = $Enums.PricingOptionType

export const PricingOptionType: typeof $Enums.PricingOptionType

export type PricingRuleType = $Enums.PricingRuleType

export const PricingRuleType: typeof $Enums.PricingRuleType

export type QuoteStatus = $Enums.QuoteStatus

export const QuoteStatus: typeof $Enums.QuoteStatus

export type QuoteLineKind = $Enums.QuoteLineKind

export const QuoteLineKind: typeof $Enums.QuoteLineKind

export type PaymentStageKind = $Enums.PaymentStageKind

export const PaymentStageKind: typeof $Enums.PaymentStageKind

export type ContractDraftStatus = $Enums.ContractDraftStatus

export const ContractDraftStatus: typeof $Enums.ContractDraftStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Inquiries
 * const inquiries = await prisma.inquiry.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Inquiries
   * const inquiries = await prisma.inquiry.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.inquiry`: Exposes CRUD operations for the **Inquiry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Inquiries
    * const inquiries = await prisma.inquiry.findMany()
    * ```
    */
  get inquiry(): Prisma.InquiryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.serviceType`: Exposes CRUD operations for the **ServiceType** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ServiceTypes
    * const serviceTypes = await prisma.serviceType.findMany()
    * ```
    */
  get serviceType(): Prisma.ServiceTypeDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pricingOption`: Exposes CRUD operations for the **PricingOption** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PricingOptions
    * const pricingOptions = await prisma.pricingOption.findMany()
    * ```
    */
  get pricingOption(): Prisma.PricingOptionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pricingRule`: Exposes CRUD operations for the **PricingRule** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PricingRules
    * const pricingRules = await prisma.pricingRule.findMany()
    * ```
    */
  get pricingRule(): Prisma.PricingRuleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.quote`: Exposes CRUD operations for the **Quote** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Quotes
    * const quotes = await prisma.quote.findMany()
    * ```
    */
  get quote(): Prisma.QuoteDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.quoteLineItem`: Exposes CRUD operations for the **QuoteLineItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuoteLineItems
    * const quoteLineItems = await prisma.quoteLineItem.findMany()
    * ```
    */
  get quoteLineItem(): Prisma.QuoteLineItemDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.quoteAdjustment`: Exposes CRUD operations for the **QuoteAdjustment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more QuoteAdjustments
    * const quoteAdjustments = await prisma.quoteAdjustment.findMany()
    * ```
    */
  get quoteAdjustment(): Prisma.QuoteAdjustmentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.paymentPlan`: Exposes CRUD operations for the **PaymentPlan** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PaymentPlans
    * const paymentPlans = await prisma.paymentPlan.findMany()
    * ```
    */
  get paymentPlan(): Prisma.PaymentPlanDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.contractDraft`: Exposes CRUD operations for the **ContractDraft** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ContractDrafts
    * const contractDrafts = await prisma.contractDraft.findMany()
    * ```
    */
  get contractDraft(): Prisma.ContractDraftDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.legacyImportLog`: Exposes CRUD operations for the **LegacyImportLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LegacyImportLogs
    * const legacyImportLogs = await prisma.legacyImportLog.findMany()
    * ```
    */
  get legacyImportLog(): Prisma.LegacyImportLogDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Inquiry: 'Inquiry',
    ServiceType: 'ServiceType',
    PricingOption: 'PricingOption',
    PricingRule: 'PricingRule',
    Quote: 'Quote',
    QuoteLineItem: 'QuoteLineItem',
    QuoteAdjustment: 'QuoteAdjustment',
    PaymentPlan: 'PaymentPlan',
    ContractDraft: 'ContractDraft',
    LegacyImportLog: 'LegacyImportLog'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "inquiry" | "serviceType" | "pricingOption" | "pricingRule" | "quote" | "quoteLineItem" | "quoteAdjustment" | "paymentPlan" | "contractDraft" | "legacyImportLog"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Inquiry: {
        payload: Prisma.$InquiryPayload<ExtArgs>
        fields: Prisma.InquiryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InquiryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InquiryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          findFirst: {
            args: Prisma.InquiryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InquiryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          findMany: {
            args: Prisma.InquiryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>[]
          }
          create: {
            args: Prisma.InquiryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          createMany: {
            args: Prisma.InquiryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InquiryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>[]
          }
          delete: {
            args: Prisma.InquiryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          update: {
            args: Prisma.InquiryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          deleteMany: {
            args: Prisma.InquiryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InquiryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InquiryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>[]
          }
          upsert: {
            args: Prisma.InquiryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          aggregate: {
            args: Prisma.InquiryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInquiry>
          }
          groupBy: {
            args: Prisma.InquiryGroupByArgs<ExtArgs>
            result: $Utils.Optional<InquiryGroupByOutputType>[]
          }
          count: {
            args: Prisma.InquiryCountArgs<ExtArgs>
            result: $Utils.Optional<InquiryCountAggregateOutputType> | number
          }
        }
      }
      ServiceType: {
        payload: Prisma.$ServiceTypePayload<ExtArgs>
        fields: Prisma.ServiceTypeFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ServiceTypeFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ServiceTypeFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload>
          }
          findFirst: {
            args: Prisma.ServiceTypeFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ServiceTypeFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload>
          }
          findMany: {
            args: Prisma.ServiceTypeFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload>[]
          }
          create: {
            args: Prisma.ServiceTypeCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload>
          }
          createMany: {
            args: Prisma.ServiceTypeCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ServiceTypeCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload>[]
          }
          delete: {
            args: Prisma.ServiceTypeDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload>
          }
          update: {
            args: Prisma.ServiceTypeUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload>
          }
          deleteMany: {
            args: Prisma.ServiceTypeDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ServiceTypeUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ServiceTypeUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload>[]
          }
          upsert: {
            args: Prisma.ServiceTypeUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceTypePayload>
          }
          aggregate: {
            args: Prisma.ServiceTypeAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateServiceType>
          }
          groupBy: {
            args: Prisma.ServiceTypeGroupByArgs<ExtArgs>
            result: $Utils.Optional<ServiceTypeGroupByOutputType>[]
          }
          count: {
            args: Prisma.ServiceTypeCountArgs<ExtArgs>
            result: $Utils.Optional<ServiceTypeCountAggregateOutputType> | number
          }
        }
      }
      PricingOption: {
        payload: Prisma.$PricingOptionPayload<ExtArgs>
        fields: Prisma.PricingOptionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PricingOptionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PricingOptionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload>
          }
          findFirst: {
            args: Prisma.PricingOptionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PricingOptionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload>
          }
          findMany: {
            args: Prisma.PricingOptionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload>[]
          }
          create: {
            args: Prisma.PricingOptionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload>
          }
          createMany: {
            args: Prisma.PricingOptionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PricingOptionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload>[]
          }
          delete: {
            args: Prisma.PricingOptionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload>
          }
          update: {
            args: Prisma.PricingOptionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload>
          }
          deleteMany: {
            args: Prisma.PricingOptionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PricingOptionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PricingOptionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload>[]
          }
          upsert: {
            args: Prisma.PricingOptionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingOptionPayload>
          }
          aggregate: {
            args: Prisma.PricingOptionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePricingOption>
          }
          groupBy: {
            args: Prisma.PricingOptionGroupByArgs<ExtArgs>
            result: $Utils.Optional<PricingOptionGroupByOutputType>[]
          }
          count: {
            args: Prisma.PricingOptionCountArgs<ExtArgs>
            result: $Utils.Optional<PricingOptionCountAggregateOutputType> | number
          }
        }
      }
      PricingRule: {
        payload: Prisma.$PricingRulePayload<ExtArgs>
        fields: Prisma.PricingRuleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PricingRuleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PricingRuleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload>
          }
          findFirst: {
            args: Prisma.PricingRuleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PricingRuleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload>
          }
          findMany: {
            args: Prisma.PricingRuleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload>[]
          }
          create: {
            args: Prisma.PricingRuleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload>
          }
          createMany: {
            args: Prisma.PricingRuleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PricingRuleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload>[]
          }
          delete: {
            args: Prisma.PricingRuleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload>
          }
          update: {
            args: Prisma.PricingRuleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload>
          }
          deleteMany: {
            args: Prisma.PricingRuleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PricingRuleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PricingRuleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload>[]
          }
          upsert: {
            args: Prisma.PricingRuleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingRulePayload>
          }
          aggregate: {
            args: Prisma.PricingRuleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePricingRule>
          }
          groupBy: {
            args: Prisma.PricingRuleGroupByArgs<ExtArgs>
            result: $Utils.Optional<PricingRuleGroupByOutputType>[]
          }
          count: {
            args: Prisma.PricingRuleCountArgs<ExtArgs>
            result: $Utils.Optional<PricingRuleCountAggregateOutputType> | number
          }
        }
      }
      Quote: {
        payload: Prisma.$QuotePayload<ExtArgs>
        fields: Prisma.QuoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          findFirst: {
            args: Prisma.QuoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          findMany: {
            args: Prisma.QuoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>[]
          }
          create: {
            args: Prisma.QuoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          createMany: {
            args: Prisma.QuoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuoteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>[]
          }
          delete: {
            args: Prisma.QuoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          update: {
            args: Prisma.QuoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          deleteMany: {
            args: Prisma.QuoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QuoteUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>[]
          }
          upsert: {
            args: Prisma.QuoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuotePayload>
          }
          aggregate: {
            args: Prisma.QuoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuote>
          }
          groupBy: {
            args: Prisma.QuoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuoteCountArgs<ExtArgs>
            result: $Utils.Optional<QuoteCountAggregateOutputType> | number
          }
        }
      }
      QuoteLineItem: {
        payload: Prisma.$QuoteLineItemPayload<ExtArgs>
        fields: Prisma.QuoteLineItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuoteLineItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuoteLineItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          findFirst: {
            args: Prisma.QuoteLineItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuoteLineItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          findMany: {
            args: Prisma.QuoteLineItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>[]
          }
          create: {
            args: Prisma.QuoteLineItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          createMany: {
            args: Prisma.QuoteLineItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuoteLineItemCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>[]
          }
          delete: {
            args: Prisma.QuoteLineItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          update: {
            args: Prisma.QuoteLineItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          deleteMany: {
            args: Prisma.QuoteLineItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuoteLineItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QuoteLineItemUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>[]
          }
          upsert: {
            args: Prisma.QuoteLineItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteLineItemPayload>
          }
          aggregate: {
            args: Prisma.QuoteLineItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuoteLineItem>
          }
          groupBy: {
            args: Prisma.QuoteLineItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuoteLineItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuoteLineItemCountArgs<ExtArgs>
            result: $Utils.Optional<QuoteLineItemCountAggregateOutputType> | number
          }
        }
      }
      QuoteAdjustment: {
        payload: Prisma.$QuoteAdjustmentPayload<ExtArgs>
        fields: Prisma.QuoteAdjustmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.QuoteAdjustmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.QuoteAdjustmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload>
          }
          findFirst: {
            args: Prisma.QuoteAdjustmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.QuoteAdjustmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload>
          }
          findMany: {
            args: Prisma.QuoteAdjustmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload>[]
          }
          create: {
            args: Prisma.QuoteAdjustmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload>
          }
          createMany: {
            args: Prisma.QuoteAdjustmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.QuoteAdjustmentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload>[]
          }
          delete: {
            args: Prisma.QuoteAdjustmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload>
          }
          update: {
            args: Prisma.QuoteAdjustmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload>
          }
          deleteMany: {
            args: Prisma.QuoteAdjustmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.QuoteAdjustmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.QuoteAdjustmentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload>[]
          }
          upsert: {
            args: Prisma.QuoteAdjustmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$QuoteAdjustmentPayload>
          }
          aggregate: {
            args: Prisma.QuoteAdjustmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateQuoteAdjustment>
          }
          groupBy: {
            args: Prisma.QuoteAdjustmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<QuoteAdjustmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.QuoteAdjustmentCountArgs<ExtArgs>
            result: $Utils.Optional<QuoteAdjustmentCountAggregateOutputType> | number
          }
        }
      }
      PaymentPlan: {
        payload: Prisma.$PaymentPlanPayload<ExtArgs>
        fields: Prisma.PaymentPlanFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PaymentPlanFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PaymentPlanFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload>
          }
          findFirst: {
            args: Prisma.PaymentPlanFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PaymentPlanFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload>
          }
          findMany: {
            args: Prisma.PaymentPlanFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload>[]
          }
          create: {
            args: Prisma.PaymentPlanCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload>
          }
          createMany: {
            args: Prisma.PaymentPlanCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PaymentPlanCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload>[]
          }
          delete: {
            args: Prisma.PaymentPlanDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload>
          }
          update: {
            args: Prisma.PaymentPlanUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload>
          }
          deleteMany: {
            args: Prisma.PaymentPlanDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PaymentPlanUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PaymentPlanUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload>[]
          }
          upsert: {
            args: Prisma.PaymentPlanUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPlanPayload>
          }
          aggregate: {
            args: Prisma.PaymentPlanAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePaymentPlan>
          }
          groupBy: {
            args: Prisma.PaymentPlanGroupByArgs<ExtArgs>
            result: $Utils.Optional<PaymentPlanGroupByOutputType>[]
          }
          count: {
            args: Prisma.PaymentPlanCountArgs<ExtArgs>
            result: $Utils.Optional<PaymentPlanCountAggregateOutputType> | number
          }
        }
      }
      ContractDraft: {
        payload: Prisma.$ContractDraftPayload<ExtArgs>
        fields: Prisma.ContractDraftFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ContractDraftFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ContractDraftFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload>
          }
          findFirst: {
            args: Prisma.ContractDraftFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ContractDraftFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload>
          }
          findMany: {
            args: Prisma.ContractDraftFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload>[]
          }
          create: {
            args: Prisma.ContractDraftCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload>
          }
          createMany: {
            args: Prisma.ContractDraftCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ContractDraftCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload>[]
          }
          delete: {
            args: Prisma.ContractDraftDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload>
          }
          update: {
            args: Prisma.ContractDraftUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload>
          }
          deleteMany: {
            args: Prisma.ContractDraftDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ContractDraftUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ContractDraftUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload>[]
          }
          upsert: {
            args: Prisma.ContractDraftUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ContractDraftPayload>
          }
          aggregate: {
            args: Prisma.ContractDraftAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateContractDraft>
          }
          groupBy: {
            args: Prisma.ContractDraftGroupByArgs<ExtArgs>
            result: $Utils.Optional<ContractDraftGroupByOutputType>[]
          }
          count: {
            args: Prisma.ContractDraftCountArgs<ExtArgs>
            result: $Utils.Optional<ContractDraftCountAggregateOutputType> | number
          }
        }
      }
      LegacyImportLog: {
        payload: Prisma.$LegacyImportLogPayload<ExtArgs>
        fields: Prisma.LegacyImportLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LegacyImportLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LegacyImportLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload>
          }
          findFirst: {
            args: Prisma.LegacyImportLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LegacyImportLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload>
          }
          findMany: {
            args: Prisma.LegacyImportLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload>[]
          }
          create: {
            args: Prisma.LegacyImportLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload>
          }
          createMany: {
            args: Prisma.LegacyImportLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LegacyImportLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload>[]
          }
          delete: {
            args: Prisma.LegacyImportLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload>
          }
          update: {
            args: Prisma.LegacyImportLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload>
          }
          deleteMany: {
            args: Prisma.LegacyImportLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LegacyImportLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LegacyImportLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload>[]
          }
          upsert: {
            args: Prisma.LegacyImportLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LegacyImportLogPayload>
          }
          aggregate: {
            args: Prisma.LegacyImportLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLegacyImportLog>
          }
          groupBy: {
            args: Prisma.LegacyImportLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<LegacyImportLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.LegacyImportLogCountArgs<ExtArgs>
            result: $Utils.Optional<LegacyImportLogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    inquiry?: InquiryOmit
    serviceType?: ServiceTypeOmit
    pricingOption?: PricingOptionOmit
    pricingRule?: PricingRuleOmit
    quote?: QuoteOmit
    quoteLineItem?: QuoteLineItemOmit
    quoteAdjustment?: QuoteAdjustmentOmit
    paymentPlan?: PaymentPlanOmit
    contractDraft?: ContractDraftOmit
    legacyImportLog?: LegacyImportLogOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type InquiryCountOutputType
   */

  export type InquiryCountOutputType = {
    quotes: number
    contractDrafts: number
  }

  export type InquiryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quotes?: boolean | InquiryCountOutputTypeCountQuotesArgs
    contractDrafts?: boolean | InquiryCountOutputTypeCountContractDraftsArgs
  }

  // Custom InputTypes
  /**
   * InquiryCountOutputType without action
   */
  export type InquiryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InquiryCountOutputType
     */
    select?: InquiryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * InquiryCountOutputType without action
   */
  export type InquiryCountOutputTypeCountQuotesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteWhereInput
  }

  /**
   * InquiryCountOutputType without action
   */
  export type InquiryCountOutputTypeCountContractDraftsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContractDraftWhereInput
  }


  /**
   * Count Type ServiceTypeCountOutputType
   */

  export type ServiceTypeCountOutputType = {
    quoteLineItems: number
  }

  export type ServiceTypeCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quoteLineItems?: boolean | ServiceTypeCountOutputTypeCountQuoteLineItemsArgs
  }

  // Custom InputTypes
  /**
   * ServiceTypeCountOutputType without action
   */
  export type ServiceTypeCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceTypeCountOutputType
     */
    select?: ServiceTypeCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ServiceTypeCountOutputType without action
   */
  export type ServiceTypeCountOutputTypeCountQuoteLineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteLineItemWhereInput
  }


  /**
   * Count Type PricingOptionCountOutputType
   */

  export type PricingOptionCountOutputType = {
    quoteAdjustments: number
  }

  export type PricingOptionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quoteAdjustments?: boolean | PricingOptionCountOutputTypeCountQuoteAdjustmentsArgs
  }

  // Custom InputTypes
  /**
   * PricingOptionCountOutputType without action
   */
  export type PricingOptionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOptionCountOutputType
     */
    select?: PricingOptionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PricingOptionCountOutputType without action
   */
  export type PricingOptionCountOutputTypeCountQuoteAdjustmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteAdjustmentWhereInput
  }


  /**
   * Count Type QuoteCountOutputType
   */

  export type QuoteCountOutputType = {
    lineItems: number
    adjustments: number
    paymentPlans: number
  }

  export type QuoteCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    lineItems?: boolean | QuoteCountOutputTypeCountLineItemsArgs
    adjustments?: boolean | QuoteCountOutputTypeCountAdjustmentsArgs
    paymentPlans?: boolean | QuoteCountOutputTypeCountPaymentPlansArgs
  }

  // Custom InputTypes
  /**
   * QuoteCountOutputType without action
   */
  export type QuoteCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteCountOutputType
     */
    select?: QuoteCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * QuoteCountOutputType without action
   */
  export type QuoteCountOutputTypeCountLineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteLineItemWhereInput
  }

  /**
   * QuoteCountOutputType without action
   */
  export type QuoteCountOutputTypeCountAdjustmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteAdjustmentWhereInput
  }

  /**
   * QuoteCountOutputType without action
   */
  export type QuoteCountOutputTypeCountPaymentPlansArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentPlanWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Inquiry
   */

  export type AggregateInquiry = {
    _count: InquiryCountAggregateOutputType | null
    _avg: InquiryAvgAggregateOutputType | null
    _sum: InquirySumAggregateOutputType | null
    _min: InquiryMinAggregateOutputType | null
    _max: InquiryMaxAggregateOutputType | null
  }

  export type InquiryAvgAggregateOutputType = {
    classificationConfidence: number | null
    qualificationScore: number | null
  }

  export type InquirySumAggregateOutputType = {
    classificationConfidence: number | null
    qualificationScore: number | null
  }

  export type InquiryMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    updatedAt: Date | null
    status: $Enums.InquiryStatus | null
    inquiryType: $Enums.InquiryType | null
    urgencyLevel: $Enums.UrgencyLevel | null
    classificationConfidence: number | null
    qualificationScore: number | null
    preferredLanguage: $Enums.LanguageCode | null
    clientType: $Enums.ClientType | null
    contactName: string | null
    organizationName: string | null
    email: string | null
    phone: string | null
    title: string | null
    description: string | null
    nationality: string | null
    currentStatus: string | null
    documentCountry: string | null
    targetAgency: string | null
    dueDate: Date | null
    assignee: string | null
    internalMemo: string | null
    wantsCallback: boolean | null
    consentToPrivacy: boolean | null
    intakeSource: string | null
    generatedSummary: string | null
    generatedGuidance: string | null
    generatedReceiptMessage: string | null
    classificationReason: string | null
    recommendedNextStep: string | null
    serviceTags: string | null
  }

  export type InquiryMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    updatedAt: Date | null
    status: $Enums.InquiryStatus | null
    inquiryType: $Enums.InquiryType | null
    urgencyLevel: $Enums.UrgencyLevel | null
    classificationConfidence: number | null
    qualificationScore: number | null
    preferredLanguage: $Enums.LanguageCode | null
    clientType: $Enums.ClientType | null
    contactName: string | null
    organizationName: string | null
    email: string | null
    phone: string | null
    title: string | null
    description: string | null
    nationality: string | null
    currentStatus: string | null
    documentCountry: string | null
    targetAgency: string | null
    dueDate: Date | null
    assignee: string | null
    internalMemo: string | null
    wantsCallback: boolean | null
    consentToPrivacy: boolean | null
    intakeSource: string | null
    generatedSummary: string | null
    generatedGuidance: string | null
    generatedReceiptMessage: string | null
    classificationReason: string | null
    recommendedNextStep: string | null
    serviceTags: string | null
  }

  export type InquiryCountAggregateOutputType = {
    id: number
    createdAt: number
    updatedAt: number
    status: number
    inquiryType: number
    urgencyLevel: number
    classificationConfidence: number
    qualificationScore: number
    preferredLanguage: number
    clientType: number
    contactName: number
    organizationName: number
    email: number
    phone: number
    title: number
    description: number
    nationality: number
    currentStatus: number
    documentCountry: number
    targetAgency: number
    dueDate: number
    assignee: number
    internalMemo: number
    wantsCallback: number
    consentToPrivacy: number
    intakeSource: number
    generatedSummary: number
    generatedGuidance: number
    generatedReceiptMessage: number
    classificationReason: number
    recommendedNextStep: number
    serviceTags: number
    _all: number
  }


  export type InquiryAvgAggregateInputType = {
    classificationConfidence?: true
    qualificationScore?: true
  }

  export type InquirySumAggregateInputType = {
    classificationConfidence?: true
    qualificationScore?: true
  }

  export type InquiryMinAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    status?: true
    inquiryType?: true
    urgencyLevel?: true
    classificationConfidence?: true
    qualificationScore?: true
    preferredLanguage?: true
    clientType?: true
    contactName?: true
    organizationName?: true
    email?: true
    phone?: true
    title?: true
    description?: true
    nationality?: true
    currentStatus?: true
    documentCountry?: true
    targetAgency?: true
    dueDate?: true
    assignee?: true
    internalMemo?: true
    wantsCallback?: true
    consentToPrivacy?: true
    intakeSource?: true
    generatedSummary?: true
    generatedGuidance?: true
    generatedReceiptMessage?: true
    classificationReason?: true
    recommendedNextStep?: true
    serviceTags?: true
  }

  export type InquiryMaxAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    status?: true
    inquiryType?: true
    urgencyLevel?: true
    classificationConfidence?: true
    qualificationScore?: true
    preferredLanguage?: true
    clientType?: true
    contactName?: true
    organizationName?: true
    email?: true
    phone?: true
    title?: true
    description?: true
    nationality?: true
    currentStatus?: true
    documentCountry?: true
    targetAgency?: true
    dueDate?: true
    assignee?: true
    internalMemo?: true
    wantsCallback?: true
    consentToPrivacy?: true
    intakeSource?: true
    generatedSummary?: true
    generatedGuidance?: true
    generatedReceiptMessage?: true
    classificationReason?: true
    recommendedNextStep?: true
    serviceTags?: true
  }

  export type InquiryCountAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    status?: true
    inquiryType?: true
    urgencyLevel?: true
    classificationConfidence?: true
    qualificationScore?: true
    preferredLanguage?: true
    clientType?: true
    contactName?: true
    organizationName?: true
    email?: true
    phone?: true
    title?: true
    description?: true
    nationality?: true
    currentStatus?: true
    documentCountry?: true
    targetAgency?: true
    dueDate?: true
    assignee?: true
    internalMemo?: true
    wantsCallback?: true
    consentToPrivacy?: true
    intakeSource?: true
    generatedSummary?: true
    generatedGuidance?: true
    generatedReceiptMessage?: true
    classificationReason?: true
    recommendedNextStep?: true
    serviceTags?: true
    _all?: true
  }

  export type InquiryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Inquiry to aggregate.
     */
    where?: InquiryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inquiries to fetch.
     */
    orderBy?: InquiryOrderByWithRelationInput | InquiryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InquiryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inquiries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inquiries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Inquiries
    **/
    _count?: true | InquiryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InquiryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InquirySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InquiryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InquiryMaxAggregateInputType
  }

  export type GetInquiryAggregateType<T extends InquiryAggregateArgs> = {
        [P in keyof T & keyof AggregateInquiry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInquiry[P]>
      : GetScalarType<T[P], AggregateInquiry[P]>
  }




  export type InquiryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InquiryWhereInput
    orderBy?: InquiryOrderByWithAggregationInput | InquiryOrderByWithAggregationInput[]
    by: InquiryScalarFieldEnum[] | InquiryScalarFieldEnum
    having?: InquiryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InquiryCountAggregateInputType | true
    _avg?: InquiryAvgAggregateInputType
    _sum?: InquirySumAggregateInputType
    _min?: InquiryMinAggregateInputType
    _max?: InquiryMaxAggregateInputType
  }

  export type InquiryGroupByOutputType = {
    id: string
    createdAt: Date
    updatedAt: Date
    status: $Enums.InquiryStatus
    inquiryType: $Enums.InquiryType
    urgencyLevel: $Enums.UrgencyLevel
    classificationConfidence: number
    qualificationScore: number
    preferredLanguage: $Enums.LanguageCode
    clientType: $Enums.ClientType
    contactName: string
    organizationName: string | null
    email: string
    phone: string | null
    title: string
    description: string
    nationality: string | null
    currentStatus: string | null
    documentCountry: string | null
    targetAgency: string | null
    dueDate: Date | null
    assignee: string | null
    internalMemo: string | null
    wantsCallback: boolean
    consentToPrivacy: boolean
    intakeSource: string
    generatedSummary: string
    generatedGuidance: string
    generatedReceiptMessage: string
    classificationReason: string
    recommendedNextStep: string
    serviceTags: string
    _count: InquiryCountAggregateOutputType | null
    _avg: InquiryAvgAggregateOutputType | null
    _sum: InquirySumAggregateOutputType | null
    _min: InquiryMinAggregateOutputType | null
    _max: InquiryMaxAggregateOutputType | null
  }

  type GetInquiryGroupByPayload<T extends InquiryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InquiryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InquiryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InquiryGroupByOutputType[P]>
            : GetScalarType<T[P], InquiryGroupByOutputType[P]>
        }
      >
    >


  export type InquirySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    status?: boolean
    inquiryType?: boolean
    urgencyLevel?: boolean
    classificationConfidence?: boolean
    qualificationScore?: boolean
    preferredLanguage?: boolean
    clientType?: boolean
    contactName?: boolean
    organizationName?: boolean
    email?: boolean
    phone?: boolean
    title?: boolean
    description?: boolean
    nationality?: boolean
    currentStatus?: boolean
    documentCountry?: boolean
    targetAgency?: boolean
    dueDate?: boolean
    assignee?: boolean
    internalMemo?: boolean
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: boolean
    generatedSummary?: boolean
    generatedGuidance?: boolean
    generatedReceiptMessage?: boolean
    classificationReason?: boolean
    recommendedNextStep?: boolean
    serviceTags?: boolean
    quotes?: boolean | Inquiry$quotesArgs<ExtArgs>
    contractDrafts?: boolean | Inquiry$contractDraftsArgs<ExtArgs>
    _count?: boolean | InquiryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inquiry"]>

  export type InquirySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    status?: boolean
    inquiryType?: boolean
    urgencyLevel?: boolean
    classificationConfidence?: boolean
    qualificationScore?: boolean
    preferredLanguage?: boolean
    clientType?: boolean
    contactName?: boolean
    organizationName?: boolean
    email?: boolean
    phone?: boolean
    title?: boolean
    description?: boolean
    nationality?: boolean
    currentStatus?: boolean
    documentCountry?: boolean
    targetAgency?: boolean
    dueDate?: boolean
    assignee?: boolean
    internalMemo?: boolean
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: boolean
    generatedSummary?: boolean
    generatedGuidance?: boolean
    generatedReceiptMessage?: boolean
    classificationReason?: boolean
    recommendedNextStep?: boolean
    serviceTags?: boolean
  }, ExtArgs["result"]["inquiry"]>

  export type InquirySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    status?: boolean
    inquiryType?: boolean
    urgencyLevel?: boolean
    classificationConfidence?: boolean
    qualificationScore?: boolean
    preferredLanguage?: boolean
    clientType?: boolean
    contactName?: boolean
    organizationName?: boolean
    email?: boolean
    phone?: boolean
    title?: boolean
    description?: boolean
    nationality?: boolean
    currentStatus?: boolean
    documentCountry?: boolean
    targetAgency?: boolean
    dueDate?: boolean
    assignee?: boolean
    internalMemo?: boolean
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: boolean
    generatedSummary?: boolean
    generatedGuidance?: boolean
    generatedReceiptMessage?: boolean
    classificationReason?: boolean
    recommendedNextStep?: boolean
    serviceTags?: boolean
  }, ExtArgs["result"]["inquiry"]>

  export type InquirySelectScalar = {
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    status?: boolean
    inquiryType?: boolean
    urgencyLevel?: boolean
    classificationConfidence?: boolean
    qualificationScore?: boolean
    preferredLanguage?: boolean
    clientType?: boolean
    contactName?: boolean
    organizationName?: boolean
    email?: boolean
    phone?: boolean
    title?: boolean
    description?: boolean
    nationality?: boolean
    currentStatus?: boolean
    documentCountry?: boolean
    targetAgency?: boolean
    dueDate?: boolean
    assignee?: boolean
    internalMemo?: boolean
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: boolean
    generatedSummary?: boolean
    generatedGuidance?: boolean
    generatedReceiptMessage?: boolean
    classificationReason?: boolean
    recommendedNextStep?: boolean
    serviceTags?: boolean
  }

  export type InquiryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "updatedAt" | "status" | "inquiryType" | "urgencyLevel" | "classificationConfidence" | "qualificationScore" | "preferredLanguage" | "clientType" | "contactName" | "organizationName" | "email" | "phone" | "title" | "description" | "nationality" | "currentStatus" | "documentCountry" | "targetAgency" | "dueDate" | "assignee" | "internalMemo" | "wantsCallback" | "consentToPrivacy" | "intakeSource" | "generatedSummary" | "generatedGuidance" | "generatedReceiptMessage" | "classificationReason" | "recommendedNextStep" | "serviceTags", ExtArgs["result"]["inquiry"]>
  export type InquiryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quotes?: boolean | Inquiry$quotesArgs<ExtArgs>
    contractDrafts?: boolean | Inquiry$contractDraftsArgs<ExtArgs>
    _count?: boolean | InquiryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type InquiryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type InquiryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $InquiryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Inquiry"
    objects: {
      quotes: Prisma.$QuotePayload<ExtArgs>[]
      contractDrafts: Prisma.$ContractDraftPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      updatedAt: Date
      status: $Enums.InquiryStatus
      inquiryType: $Enums.InquiryType
      urgencyLevel: $Enums.UrgencyLevel
      classificationConfidence: number
      qualificationScore: number
      preferredLanguage: $Enums.LanguageCode
      clientType: $Enums.ClientType
      contactName: string
      organizationName: string | null
      email: string
      phone: string | null
      title: string
      description: string
      nationality: string | null
      currentStatus: string | null
      documentCountry: string | null
      targetAgency: string | null
      dueDate: Date | null
      assignee: string | null
      internalMemo: string | null
      wantsCallback: boolean
      consentToPrivacy: boolean
      intakeSource: string
      generatedSummary: string
      generatedGuidance: string
      generatedReceiptMessage: string
      classificationReason: string
      recommendedNextStep: string
      serviceTags: string
    }, ExtArgs["result"]["inquiry"]>
    composites: {}
  }

  type InquiryGetPayload<S extends boolean | null | undefined | InquiryDefaultArgs> = $Result.GetResult<Prisma.$InquiryPayload, S>

  type InquiryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InquiryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InquiryCountAggregateInputType | true
    }

  export interface InquiryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Inquiry'], meta: { name: 'Inquiry' } }
    /**
     * Find zero or one Inquiry that matches the filter.
     * @param {InquiryFindUniqueArgs} args - Arguments to find a Inquiry
     * @example
     * // Get one Inquiry
     * const inquiry = await prisma.inquiry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InquiryFindUniqueArgs>(args: SelectSubset<T, InquiryFindUniqueArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Inquiry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InquiryFindUniqueOrThrowArgs} args - Arguments to find a Inquiry
     * @example
     * // Get one Inquiry
     * const inquiry = await prisma.inquiry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InquiryFindUniqueOrThrowArgs>(args: SelectSubset<T, InquiryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Inquiry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryFindFirstArgs} args - Arguments to find a Inquiry
     * @example
     * // Get one Inquiry
     * const inquiry = await prisma.inquiry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InquiryFindFirstArgs>(args?: SelectSubset<T, InquiryFindFirstArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Inquiry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryFindFirstOrThrowArgs} args - Arguments to find a Inquiry
     * @example
     * // Get one Inquiry
     * const inquiry = await prisma.inquiry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InquiryFindFirstOrThrowArgs>(args?: SelectSubset<T, InquiryFindFirstOrThrowArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Inquiries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Inquiries
     * const inquiries = await prisma.inquiry.findMany()
     * 
     * // Get first 10 Inquiries
     * const inquiries = await prisma.inquiry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const inquiryWithIdOnly = await prisma.inquiry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InquiryFindManyArgs>(args?: SelectSubset<T, InquiryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Inquiry.
     * @param {InquiryCreateArgs} args - Arguments to create a Inquiry.
     * @example
     * // Create one Inquiry
     * const Inquiry = await prisma.inquiry.create({
     *   data: {
     *     // ... data to create a Inquiry
     *   }
     * })
     * 
     */
    create<T extends InquiryCreateArgs>(args: SelectSubset<T, InquiryCreateArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Inquiries.
     * @param {InquiryCreateManyArgs} args - Arguments to create many Inquiries.
     * @example
     * // Create many Inquiries
     * const inquiry = await prisma.inquiry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InquiryCreateManyArgs>(args?: SelectSubset<T, InquiryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Inquiries and returns the data saved in the database.
     * @param {InquiryCreateManyAndReturnArgs} args - Arguments to create many Inquiries.
     * @example
     * // Create many Inquiries
     * const inquiry = await prisma.inquiry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Inquiries and only return the `id`
     * const inquiryWithIdOnly = await prisma.inquiry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InquiryCreateManyAndReturnArgs>(args?: SelectSubset<T, InquiryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Inquiry.
     * @param {InquiryDeleteArgs} args - Arguments to delete one Inquiry.
     * @example
     * // Delete one Inquiry
     * const Inquiry = await prisma.inquiry.delete({
     *   where: {
     *     // ... filter to delete one Inquiry
     *   }
     * })
     * 
     */
    delete<T extends InquiryDeleteArgs>(args: SelectSubset<T, InquiryDeleteArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Inquiry.
     * @param {InquiryUpdateArgs} args - Arguments to update one Inquiry.
     * @example
     * // Update one Inquiry
     * const inquiry = await prisma.inquiry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InquiryUpdateArgs>(args: SelectSubset<T, InquiryUpdateArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Inquiries.
     * @param {InquiryDeleteManyArgs} args - Arguments to filter Inquiries to delete.
     * @example
     * // Delete a few Inquiries
     * const { count } = await prisma.inquiry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InquiryDeleteManyArgs>(args?: SelectSubset<T, InquiryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Inquiries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Inquiries
     * const inquiry = await prisma.inquiry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InquiryUpdateManyArgs>(args: SelectSubset<T, InquiryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Inquiries and returns the data updated in the database.
     * @param {InquiryUpdateManyAndReturnArgs} args - Arguments to update many Inquiries.
     * @example
     * // Update many Inquiries
     * const inquiry = await prisma.inquiry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Inquiries and only return the `id`
     * const inquiryWithIdOnly = await prisma.inquiry.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InquiryUpdateManyAndReturnArgs>(args: SelectSubset<T, InquiryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Inquiry.
     * @param {InquiryUpsertArgs} args - Arguments to update or create a Inquiry.
     * @example
     * // Update or create a Inquiry
     * const inquiry = await prisma.inquiry.upsert({
     *   create: {
     *     // ... data to create a Inquiry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Inquiry we want to update
     *   }
     * })
     */
    upsert<T extends InquiryUpsertArgs>(args: SelectSubset<T, InquiryUpsertArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Inquiries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryCountArgs} args - Arguments to filter Inquiries to count.
     * @example
     * // Count the number of Inquiries
     * const count = await prisma.inquiry.count({
     *   where: {
     *     // ... the filter for the Inquiries we want to count
     *   }
     * })
    **/
    count<T extends InquiryCountArgs>(
      args?: Subset<T, InquiryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InquiryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Inquiry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InquiryAggregateArgs>(args: Subset<T, InquiryAggregateArgs>): Prisma.PrismaPromise<GetInquiryAggregateType<T>>

    /**
     * Group by Inquiry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InquiryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InquiryGroupByArgs['orderBy'] }
        : { orderBy?: InquiryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InquiryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInquiryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Inquiry model
   */
  readonly fields: InquiryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Inquiry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InquiryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quotes<T extends Inquiry$quotesArgs<ExtArgs> = {}>(args?: Subset<T, Inquiry$quotesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    contractDrafts<T extends Inquiry$contractDraftsArgs<ExtArgs> = {}>(args?: Subset<T, Inquiry$contractDraftsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Inquiry model
   */
  interface InquiryFieldRefs {
    readonly id: FieldRef<"Inquiry", 'String'>
    readonly createdAt: FieldRef<"Inquiry", 'DateTime'>
    readonly updatedAt: FieldRef<"Inquiry", 'DateTime'>
    readonly status: FieldRef<"Inquiry", 'InquiryStatus'>
    readonly inquiryType: FieldRef<"Inquiry", 'InquiryType'>
    readonly urgencyLevel: FieldRef<"Inquiry", 'UrgencyLevel'>
    readonly classificationConfidence: FieldRef<"Inquiry", 'Float'>
    readonly qualificationScore: FieldRef<"Inquiry", 'Int'>
    readonly preferredLanguage: FieldRef<"Inquiry", 'LanguageCode'>
    readonly clientType: FieldRef<"Inquiry", 'ClientType'>
    readonly contactName: FieldRef<"Inquiry", 'String'>
    readonly organizationName: FieldRef<"Inquiry", 'String'>
    readonly email: FieldRef<"Inquiry", 'String'>
    readonly phone: FieldRef<"Inquiry", 'String'>
    readonly title: FieldRef<"Inquiry", 'String'>
    readonly description: FieldRef<"Inquiry", 'String'>
    readonly nationality: FieldRef<"Inquiry", 'String'>
    readonly currentStatus: FieldRef<"Inquiry", 'String'>
    readonly documentCountry: FieldRef<"Inquiry", 'String'>
    readonly targetAgency: FieldRef<"Inquiry", 'String'>
    readonly dueDate: FieldRef<"Inquiry", 'DateTime'>
    readonly assignee: FieldRef<"Inquiry", 'String'>
    readonly internalMemo: FieldRef<"Inquiry", 'String'>
    readonly wantsCallback: FieldRef<"Inquiry", 'Boolean'>
    readonly consentToPrivacy: FieldRef<"Inquiry", 'Boolean'>
    readonly intakeSource: FieldRef<"Inquiry", 'String'>
    readonly generatedSummary: FieldRef<"Inquiry", 'String'>
    readonly generatedGuidance: FieldRef<"Inquiry", 'String'>
    readonly generatedReceiptMessage: FieldRef<"Inquiry", 'String'>
    readonly classificationReason: FieldRef<"Inquiry", 'String'>
    readonly recommendedNextStep: FieldRef<"Inquiry", 'String'>
    readonly serviceTags: FieldRef<"Inquiry", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Inquiry findUnique
   */
  export type InquiryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InquiryInclude<ExtArgs> | null
    /**
     * Filter, which Inquiry to fetch.
     */
    where: InquiryWhereUniqueInput
  }

  /**
   * Inquiry findUniqueOrThrow
   */
  export type InquiryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InquiryInclude<ExtArgs> | null
    /**
     * Filter, which Inquiry to fetch.
     */
    where: InquiryWhereUniqueInput
  }

  /**
   * Inquiry findFirst
   */
  export type InquiryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InquiryInclude<ExtArgs> | null
    /**
     * Filter, which Inquiry to fetch.
     */
    where?: InquiryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inquiries to fetch.
     */
    orderBy?: InquiryOrderByWithRelationInput | InquiryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Inquiries.
     */
    cursor?: InquiryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inquiries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inquiries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inquiries.
     */
    distinct?: InquiryScalarFieldEnum | InquiryScalarFieldEnum[]
  }

  /**
   * Inquiry findFirstOrThrow
   */
  export type InquiryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InquiryInclude<ExtArgs> | null
    /**
     * Filter, which Inquiry to fetch.
     */
    where?: InquiryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inquiries to fetch.
     */
    orderBy?: InquiryOrderByWithRelationInput | InquiryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Inquiries.
     */
    cursor?: InquiryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inquiries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inquiries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inquiries.
     */
    distinct?: InquiryScalarFieldEnum | InquiryScalarFieldEnum[]
  }

  /**
   * Inquiry findMany
   */
  export type InquiryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InquiryInclude<ExtArgs> | null
    /**
     * Filter, which Inquiries to fetch.
     */
    where?: InquiryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inquiries to fetch.
     */
    orderBy?: InquiryOrderByWithRelationInput | InquiryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Inquiries.
     */
    cursor?: InquiryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inquiries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inquiries.
     */
    skip?: number
    distinct?: InquiryScalarFieldEnum | InquiryScalarFieldEnum[]
  }

  /**
   * Inquiry create
   */
  export type InquiryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InquiryInclude<ExtArgs> | null
    /**
     * The data needed to create a Inquiry.
     */
    data: XOR<InquiryCreateInput, InquiryUncheckedCreateInput>
  }

  /**
   * Inquiry createMany
   */
  export type InquiryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Inquiries.
     */
    data: InquiryCreateManyInput | InquiryCreateManyInput[]
  }

  /**
   * Inquiry createManyAndReturn
   */
  export type InquiryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * The data used to create many Inquiries.
     */
    data: InquiryCreateManyInput | InquiryCreateManyInput[]
  }

  /**
   * Inquiry update
   */
  export type InquiryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InquiryInclude<ExtArgs> | null
    /**
     * The data needed to update a Inquiry.
     */
    data: XOR<InquiryUpdateInput, InquiryUncheckedUpdateInput>
    /**
     * Choose, which Inquiry to update.
     */
    where: InquiryWhereUniqueInput
  }

  /**
   * Inquiry updateMany
   */
  export type InquiryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Inquiries.
     */
    data: XOR<InquiryUpdateManyMutationInput, InquiryUncheckedUpdateManyInput>
    /**
     * Filter which Inquiries to update
     */
    where?: InquiryWhereInput
    /**
     * Limit how many Inquiries to update.
     */
    limit?: number
  }

  /**
   * Inquiry updateManyAndReturn
   */
  export type InquiryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * The data used to update Inquiries.
     */
    data: XOR<InquiryUpdateManyMutationInput, InquiryUncheckedUpdateManyInput>
    /**
     * Filter which Inquiries to update
     */
    where?: InquiryWhereInput
    /**
     * Limit how many Inquiries to update.
     */
    limit?: number
  }

  /**
   * Inquiry upsert
   */
  export type InquiryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InquiryInclude<ExtArgs> | null
    /**
     * The filter to search for the Inquiry to update in case it exists.
     */
    where: InquiryWhereUniqueInput
    /**
     * In case the Inquiry found by the `where` argument doesn't exist, create a new Inquiry with this data.
     */
    create: XOR<InquiryCreateInput, InquiryUncheckedCreateInput>
    /**
     * In case the Inquiry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InquiryUpdateInput, InquiryUncheckedUpdateInput>
  }

  /**
   * Inquiry delete
   */
  export type InquiryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InquiryInclude<ExtArgs> | null
    /**
     * Filter which Inquiry to delete.
     */
    where: InquiryWhereUniqueInput
  }

  /**
   * Inquiry deleteMany
   */
  export type InquiryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Inquiries to delete
     */
    where?: InquiryWhereInput
    /**
     * Limit how many Inquiries to delete.
     */
    limit?: number
  }

  /**
   * Inquiry.quotes
   */
  export type Inquiry$quotesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    where?: QuoteWhereInput
    orderBy?: QuoteOrderByWithRelationInput | QuoteOrderByWithRelationInput[]
    cursor?: QuoteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuoteScalarFieldEnum | QuoteScalarFieldEnum[]
  }

  /**
   * Inquiry.contractDrafts
   */
  export type Inquiry$contractDraftsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    where?: ContractDraftWhereInput
    orderBy?: ContractDraftOrderByWithRelationInput | ContractDraftOrderByWithRelationInput[]
    cursor?: ContractDraftWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ContractDraftScalarFieldEnum | ContractDraftScalarFieldEnum[]
  }

  /**
   * Inquiry without action
   */
  export type InquiryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InquiryInclude<ExtArgs> | null
  }


  /**
   * Model ServiceType
   */

  export type AggregateServiceType = {
    _count: ServiceTypeCountAggregateOutputType | null
    _avg: ServiceTypeAvgAggregateOutputType | null
    _sum: ServiceTypeSumAggregateOutputType | null
    _min: ServiceTypeMinAggregateOutputType | null
    _max: ServiceTypeMaxAggregateOutputType | null
  }

  export type ServiceTypeAvgAggregateOutputType = {
    minPrice: number | null
    maxPrice: number | null
  }

  export type ServiceTypeSumAggregateOutputType = {
    minPrice: number | null
    maxPrice: number | null
  }

  export type ServiceTypeMinAggregateOutputType = {
    id: string | null
    legacyId: string | null
    name: string | null
    category: string | null
    minPrice: number | null
    maxPrice: number | null
    isAppeal: boolean | null
    isActive: boolean | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ServiceTypeMaxAggregateOutputType = {
    id: string | null
    legacyId: string | null
    name: string | null
    category: string | null
    minPrice: number | null
    maxPrice: number | null
    isAppeal: boolean | null
    isActive: boolean | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ServiceTypeCountAggregateOutputType = {
    id: number
    legacyId: number
    name: number
    category: number
    minPrice: number
    maxPrice: number
    isAppeal: number
    isActive: number
    source: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ServiceTypeAvgAggregateInputType = {
    minPrice?: true
    maxPrice?: true
  }

  export type ServiceTypeSumAggregateInputType = {
    minPrice?: true
    maxPrice?: true
  }

  export type ServiceTypeMinAggregateInputType = {
    id?: true
    legacyId?: true
    name?: true
    category?: true
    minPrice?: true
    maxPrice?: true
    isAppeal?: true
    isActive?: true
    source?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ServiceTypeMaxAggregateInputType = {
    id?: true
    legacyId?: true
    name?: true
    category?: true
    minPrice?: true
    maxPrice?: true
    isAppeal?: true
    isActive?: true
    source?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ServiceTypeCountAggregateInputType = {
    id?: true
    legacyId?: true
    name?: true
    category?: true
    minPrice?: true
    maxPrice?: true
    isAppeal?: true
    isActive?: true
    source?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ServiceTypeAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ServiceType to aggregate.
     */
    where?: ServiceTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ServiceTypes to fetch.
     */
    orderBy?: ServiceTypeOrderByWithRelationInput | ServiceTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ServiceTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ServiceTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ServiceTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ServiceTypes
    **/
    _count?: true | ServiceTypeCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ServiceTypeAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ServiceTypeSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ServiceTypeMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ServiceTypeMaxAggregateInputType
  }

  export type GetServiceTypeAggregateType<T extends ServiceTypeAggregateArgs> = {
        [P in keyof T & keyof AggregateServiceType]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateServiceType[P]>
      : GetScalarType<T[P], AggregateServiceType[P]>
  }




  export type ServiceTypeGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ServiceTypeWhereInput
    orderBy?: ServiceTypeOrderByWithAggregationInput | ServiceTypeOrderByWithAggregationInput[]
    by: ServiceTypeScalarFieldEnum[] | ServiceTypeScalarFieldEnum
    having?: ServiceTypeScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ServiceTypeCountAggregateInputType | true
    _avg?: ServiceTypeAvgAggregateInputType
    _sum?: ServiceTypeSumAggregateInputType
    _min?: ServiceTypeMinAggregateInputType
    _max?: ServiceTypeMaxAggregateInputType
  }

  export type ServiceTypeGroupByOutputType = {
    id: string
    legacyId: string
    name: string
    category: string
    minPrice: number
    maxPrice: number
    isAppeal: boolean
    isActive: boolean
    source: string
    createdAt: Date
    updatedAt: Date
    _count: ServiceTypeCountAggregateOutputType | null
    _avg: ServiceTypeAvgAggregateOutputType | null
    _sum: ServiceTypeSumAggregateOutputType | null
    _min: ServiceTypeMinAggregateOutputType | null
    _max: ServiceTypeMaxAggregateOutputType | null
  }

  type GetServiceTypeGroupByPayload<T extends ServiceTypeGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ServiceTypeGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ServiceTypeGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ServiceTypeGroupByOutputType[P]>
            : GetScalarType<T[P], ServiceTypeGroupByOutputType[P]>
        }
      >
    >


  export type ServiceTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    legacyId?: boolean
    name?: boolean
    category?: boolean
    minPrice?: boolean
    maxPrice?: boolean
    isAppeal?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quoteLineItems?: boolean | ServiceType$quoteLineItemsArgs<ExtArgs>
    _count?: boolean | ServiceTypeCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["serviceType"]>

  export type ServiceTypeSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    legacyId?: boolean
    name?: boolean
    category?: boolean
    minPrice?: boolean
    maxPrice?: boolean
    isAppeal?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["serviceType"]>

  export type ServiceTypeSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    legacyId?: boolean
    name?: boolean
    category?: boolean
    minPrice?: boolean
    maxPrice?: boolean
    isAppeal?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["serviceType"]>

  export type ServiceTypeSelectScalar = {
    id?: boolean
    legacyId?: boolean
    name?: boolean
    category?: boolean
    minPrice?: boolean
    maxPrice?: boolean
    isAppeal?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ServiceTypeOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "legacyId" | "name" | "category" | "minPrice" | "maxPrice" | "isAppeal" | "isActive" | "source" | "createdAt" | "updatedAt", ExtArgs["result"]["serviceType"]>
  export type ServiceTypeInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quoteLineItems?: boolean | ServiceType$quoteLineItemsArgs<ExtArgs>
    _count?: boolean | ServiceTypeCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ServiceTypeIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ServiceTypeIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ServiceTypePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ServiceType"
    objects: {
      quoteLineItems: Prisma.$QuoteLineItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      legacyId: string
      name: string
      category: string
      minPrice: number
      maxPrice: number
      isAppeal: boolean
      isActive: boolean
      source: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["serviceType"]>
    composites: {}
  }

  type ServiceTypeGetPayload<S extends boolean | null | undefined | ServiceTypeDefaultArgs> = $Result.GetResult<Prisma.$ServiceTypePayload, S>

  type ServiceTypeCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ServiceTypeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ServiceTypeCountAggregateInputType | true
    }

  export interface ServiceTypeDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ServiceType'], meta: { name: 'ServiceType' } }
    /**
     * Find zero or one ServiceType that matches the filter.
     * @param {ServiceTypeFindUniqueArgs} args - Arguments to find a ServiceType
     * @example
     * // Get one ServiceType
     * const serviceType = await prisma.serviceType.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ServiceTypeFindUniqueArgs>(args: SelectSubset<T, ServiceTypeFindUniqueArgs<ExtArgs>>): Prisma__ServiceTypeClient<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ServiceType that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ServiceTypeFindUniqueOrThrowArgs} args - Arguments to find a ServiceType
     * @example
     * // Get one ServiceType
     * const serviceType = await prisma.serviceType.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ServiceTypeFindUniqueOrThrowArgs>(args: SelectSubset<T, ServiceTypeFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ServiceTypeClient<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ServiceType that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceTypeFindFirstArgs} args - Arguments to find a ServiceType
     * @example
     * // Get one ServiceType
     * const serviceType = await prisma.serviceType.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ServiceTypeFindFirstArgs>(args?: SelectSubset<T, ServiceTypeFindFirstArgs<ExtArgs>>): Prisma__ServiceTypeClient<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ServiceType that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceTypeFindFirstOrThrowArgs} args - Arguments to find a ServiceType
     * @example
     * // Get one ServiceType
     * const serviceType = await prisma.serviceType.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ServiceTypeFindFirstOrThrowArgs>(args?: SelectSubset<T, ServiceTypeFindFirstOrThrowArgs<ExtArgs>>): Prisma__ServiceTypeClient<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ServiceTypes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceTypeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ServiceTypes
     * const serviceTypes = await prisma.serviceType.findMany()
     * 
     * // Get first 10 ServiceTypes
     * const serviceTypes = await prisma.serviceType.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const serviceTypeWithIdOnly = await prisma.serviceType.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ServiceTypeFindManyArgs>(args?: SelectSubset<T, ServiceTypeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ServiceType.
     * @param {ServiceTypeCreateArgs} args - Arguments to create a ServiceType.
     * @example
     * // Create one ServiceType
     * const ServiceType = await prisma.serviceType.create({
     *   data: {
     *     // ... data to create a ServiceType
     *   }
     * })
     * 
     */
    create<T extends ServiceTypeCreateArgs>(args: SelectSubset<T, ServiceTypeCreateArgs<ExtArgs>>): Prisma__ServiceTypeClient<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ServiceTypes.
     * @param {ServiceTypeCreateManyArgs} args - Arguments to create many ServiceTypes.
     * @example
     * // Create many ServiceTypes
     * const serviceType = await prisma.serviceType.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ServiceTypeCreateManyArgs>(args?: SelectSubset<T, ServiceTypeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ServiceTypes and returns the data saved in the database.
     * @param {ServiceTypeCreateManyAndReturnArgs} args - Arguments to create many ServiceTypes.
     * @example
     * // Create many ServiceTypes
     * const serviceType = await prisma.serviceType.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ServiceTypes and only return the `id`
     * const serviceTypeWithIdOnly = await prisma.serviceType.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ServiceTypeCreateManyAndReturnArgs>(args?: SelectSubset<T, ServiceTypeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ServiceType.
     * @param {ServiceTypeDeleteArgs} args - Arguments to delete one ServiceType.
     * @example
     * // Delete one ServiceType
     * const ServiceType = await prisma.serviceType.delete({
     *   where: {
     *     // ... filter to delete one ServiceType
     *   }
     * })
     * 
     */
    delete<T extends ServiceTypeDeleteArgs>(args: SelectSubset<T, ServiceTypeDeleteArgs<ExtArgs>>): Prisma__ServiceTypeClient<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ServiceType.
     * @param {ServiceTypeUpdateArgs} args - Arguments to update one ServiceType.
     * @example
     * // Update one ServiceType
     * const serviceType = await prisma.serviceType.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ServiceTypeUpdateArgs>(args: SelectSubset<T, ServiceTypeUpdateArgs<ExtArgs>>): Prisma__ServiceTypeClient<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ServiceTypes.
     * @param {ServiceTypeDeleteManyArgs} args - Arguments to filter ServiceTypes to delete.
     * @example
     * // Delete a few ServiceTypes
     * const { count } = await prisma.serviceType.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ServiceTypeDeleteManyArgs>(args?: SelectSubset<T, ServiceTypeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ServiceTypes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceTypeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ServiceTypes
     * const serviceType = await prisma.serviceType.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ServiceTypeUpdateManyArgs>(args: SelectSubset<T, ServiceTypeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ServiceTypes and returns the data updated in the database.
     * @param {ServiceTypeUpdateManyAndReturnArgs} args - Arguments to update many ServiceTypes.
     * @example
     * // Update many ServiceTypes
     * const serviceType = await prisma.serviceType.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ServiceTypes and only return the `id`
     * const serviceTypeWithIdOnly = await prisma.serviceType.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ServiceTypeUpdateManyAndReturnArgs>(args: SelectSubset<T, ServiceTypeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ServiceType.
     * @param {ServiceTypeUpsertArgs} args - Arguments to update or create a ServiceType.
     * @example
     * // Update or create a ServiceType
     * const serviceType = await prisma.serviceType.upsert({
     *   create: {
     *     // ... data to create a ServiceType
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ServiceType we want to update
     *   }
     * })
     */
    upsert<T extends ServiceTypeUpsertArgs>(args: SelectSubset<T, ServiceTypeUpsertArgs<ExtArgs>>): Prisma__ServiceTypeClient<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ServiceTypes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceTypeCountArgs} args - Arguments to filter ServiceTypes to count.
     * @example
     * // Count the number of ServiceTypes
     * const count = await prisma.serviceType.count({
     *   where: {
     *     // ... the filter for the ServiceTypes we want to count
     *   }
     * })
    **/
    count<T extends ServiceTypeCountArgs>(
      args?: Subset<T, ServiceTypeCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ServiceTypeCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ServiceType.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceTypeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ServiceTypeAggregateArgs>(args: Subset<T, ServiceTypeAggregateArgs>): Prisma.PrismaPromise<GetServiceTypeAggregateType<T>>

    /**
     * Group by ServiceType.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceTypeGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ServiceTypeGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ServiceTypeGroupByArgs['orderBy'] }
        : { orderBy?: ServiceTypeGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ServiceTypeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetServiceTypeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ServiceType model
   */
  readonly fields: ServiceTypeFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ServiceType.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ServiceTypeClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quoteLineItems<T extends ServiceType$quoteLineItemsArgs<ExtArgs> = {}>(args?: Subset<T, ServiceType$quoteLineItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ServiceType model
   */
  interface ServiceTypeFieldRefs {
    readonly id: FieldRef<"ServiceType", 'String'>
    readonly legacyId: FieldRef<"ServiceType", 'String'>
    readonly name: FieldRef<"ServiceType", 'String'>
    readonly category: FieldRef<"ServiceType", 'String'>
    readonly minPrice: FieldRef<"ServiceType", 'Int'>
    readonly maxPrice: FieldRef<"ServiceType", 'Int'>
    readonly isAppeal: FieldRef<"ServiceType", 'Boolean'>
    readonly isActive: FieldRef<"ServiceType", 'Boolean'>
    readonly source: FieldRef<"ServiceType", 'String'>
    readonly createdAt: FieldRef<"ServiceType", 'DateTime'>
    readonly updatedAt: FieldRef<"ServiceType", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ServiceType findUnique
   */
  export type ServiceTypeFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
    /**
     * Filter, which ServiceType to fetch.
     */
    where: ServiceTypeWhereUniqueInput
  }

  /**
   * ServiceType findUniqueOrThrow
   */
  export type ServiceTypeFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
    /**
     * Filter, which ServiceType to fetch.
     */
    where: ServiceTypeWhereUniqueInput
  }

  /**
   * ServiceType findFirst
   */
  export type ServiceTypeFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
    /**
     * Filter, which ServiceType to fetch.
     */
    where?: ServiceTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ServiceTypes to fetch.
     */
    orderBy?: ServiceTypeOrderByWithRelationInput | ServiceTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ServiceTypes.
     */
    cursor?: ServiceTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ServiceTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ServiceTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ServiceTypes.
     */
    distinct?: ServiceTypeScalarFieldEnum | ServiceTypeScalarFieldEnum[]
  }

  /**
   * ServiceType findFirstOrThrow
   */
  export type ServiceTypeFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
    /**
     * Filter, which ServiceType to fetch.
     */
    where?: ServiceTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ServiceTypes to fetch.
     */
    orderBy?: ServiceTypeOrderByWithRelationInput | ServiceTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ServiceTypes.
     */
    cursor?: ServiceTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ServiceTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ServiceTypes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ServiceTypes.
     */
    distinct?: ServiceTypeScalarFieldEnum | ServiceTypeScalarFieldEnum[]
  }

  /**
   * ServiceType findMany
   */
  export type ServiceTypeFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
    /**
     * Filter, which ServiceTypes to fetch.
     */
    where?: ServiceTypeWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ServiceTypes to fetch.
     */
    orderBy?: ServiceTypeOrderByWithRelationInput | ServiceTypeOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ServiceTypes.
     */
    cursor?: ServiceTypeWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ServiceTypes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ServiceTypes.
     */
    skip?: number
    distinct?: ServiceTypeScalarFieldEnum | ServiceTypeScalarFieldEnum[]
  }

  /**
   * ServiceType create
   */
  export type ServiceTypeCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
    /**
     * The data needed to create a ServiceType.
     */
    data: XOR<ServiceTypeCreateInput, ServiceTypeUncheckedCreateInput>
  }

  /**
   * ServiceType createMany
   */
  export type ServiceTypeCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ServiceTypes.
     */
    data: ServiceTypeCreateManyInput | ServiceTypeCreateManyInput[]
  }

  /**
   * ServiceType createManyAndReturn
   */
  export type ServiceTypeCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * The data used to create many ServiceTypes.
     */
    data: ServiceTypeCreateManyInput | ServiceTypeCreateManyInput[]
  }

  /**
   * ServiceType update
   */
  export type ServiceTypeUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
    /**
     * The data needed to update a ServiceType.
     */
    data: XOR<ServiceTypeUpdateInput, ServiceTypeUncheckedUpdateInput>
    /**
     * Choose, which ServiceType to update.
     */
    where: ServiceTypeWhereUniqueInput
  }

  /**
   * ServiceType updateMany
   */
  export type ServiceTypeUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ServiceTypes.
     */
    data: XOR<ServiceTypeUpdateManyMutationInput, ServiceTypeUncheckedUpdateManyInput>
    /**
     * Filter which ServiceTypes to update
     */
    where?: ServiceTypeWhereInput
    /**
     * Limit how many ServiceTypes to update.
     */
    limit?: number
  }

  /**
   * ServiceType updateManyAndReturn
   */
  export type ServiceTypeUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * The data used to update ServiceTypes.
     */
    data: XOR<ServiceTypeUpdateManyMutationInput, ServiceTypeUncheckedUpdateManyInput>
    /**
     * Filter which ServiceTypes to update
     */
    where?: ServiceTypeWhereInput
    /**
     * Limit how many ServiceTypes to update.
     */
    limit?: number
  }

  /**
   * ServiceType upsert
   */
  export type ServiceTypeUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
    /**
     * The filter to search for the ServiceType to update in case it exists.
     */
    where: ServiceTypeWhereUniqueInput
    /**
     * In case the ServiceType found by the `where` argument doesn't exist, create a new ServiceType with this data.
     */
    create: XOR<ServiceTypeCreateInput, ServiceTypeUncheckedCreateInput>
    /**
     * In case the ServiceType was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ServiceTypeUpdateInput, ServiceTypeUncheckedUpdateInput>
  }

  /**
   * ServiceType delete
   */
  export type ServiceTypeDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
    /**
     * Filter which ServiceType to delete.
     */
    where: ServiceTypeWhereUniqueInput
  }

  /**
   * ServiceType deleteMany
   */
  export type ServiceTypeDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ServiceTypes to delete
     */
    where?: ServiceTypeWhereInput
    /**
     * Limit how many ServiceTypes to delete.
     */
    limit?: number
  }

  /**
   * ServiceType.quoteLineItems
   */
  export type ServiceType$quoteLineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    where?: QuoteLineItemWhereInput
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    cursor?: QuoteLineItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuoteLineItemScalarFieldEnum | QuoteLineItemScalarFieldEnum[]
  }

  /**
   * ServiceType without action
   */
  export type ServiceTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
  }


  /**
   * Model PricingOption
   */

  export type AggregatePricingOption = {
    _count: PricingOptionCountAggregateOutputType | null
    _avg: PricingOptionAvgAggregateOutputType | null
    _sum: PricingOptionSumAggregateOutputType | null
    _min: PricingOptionMinAggregateOutputType | null
    _max: PricingOptionMaxAggregateOutputType | null
  }

  export type PricingOptionAvgAggregateOutputType = {
    flatAmount: number | null
    percentRate: number | null
  }

  export type PricingOptionSumAggregateOutputType = {
    flatAmount: number | null
    percentRate: number | null
  }

  export type PricingOptionMinAggregateOutputType = {
    id: string | null
    legacyId: string | null
    name: string | null
    description: string | null
    optionType: $Enums.PricingOptionType | null
    flatAmount: number | null
    percentRate: number | null
    unitLabel: string | null
    isVat: boolean | null
    isActive: boolean | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PricingOptionMaxAggregateOutputType = {
    id: string | null
    legacyId: string | null
    name: string | null
    description: string | null
    optionType: $Enums.PricingOptionType | null
    flatAmount: number | null
    percentRate: number | null
    unitLabel: string | null
    isVat: boolean | null
    isActive: boolean | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PricingOptionCountAggregateOutputType = {
    id: number
    legacyId: number
    name: number
    description: number
    optionType: number
    flatAmount: number
    percentRate: number
    unitLabel: number
    isVat: number
    isActive: number
    source: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PricingOptionAvgAggregateInputType = {
    flatAmount?: true
    percentRate?: true
  }

  export type PricingOptionSumAggregateInputType = {
    flatAmount?: true
    percentRate?: true
  }

  export type PricingOptionMinAggregateInputType = {
    id?: true
    legacyId?: true
    name?: true
    description?: true
    optionType?: true
    flatAmount?: true
    percentRate?: true
    unitLabel?: true
    isVat?: true
    isActive?: true
    source?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PricingOptionMaxAggregateInputType = {
    id?: true
    legacyId?: true
    name?: true
    description?: true
    optionType?: true
    flatAmount?: true
    percentRate?: true
    unitLabel?: true
    isVat?: true
    isActive?: true
    source?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PricingOptionCountAggregateInputType = {
    id?: true
    legacyId?: true
    name?: true
    description?: true
    optionType?: true
    flatAmount?: true
    percentRate?: true
    unitLabel?: true
    isVat?: true
    isActive?: true
    source?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PricingOptionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PricingOption to aggregate.
     */
    where?: PricingOptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingOptions to fetch.
     */
    orderBy?: PricingOptionOrderByWithRelationInput | PricingOptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PricingOptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingOptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingOptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PricingOptions
    **/
    _count?: true | PricingOptionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PricingOptionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PricingOptionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PricingOptionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PricingOptionMaxAggregateInputType
  }

  export type GetPricingOptionAggregateType<T extends PricingOptionAggregateArgs> = {
        [P in keyof T & keyof AggregatePricingOption]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePricingOption[P]>
      : GetScalarType<T[P], AggregatePricingOption[P]>
  }




  export type PricingOptionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PricingOptionWhereInput
    orderBy?: PricingOptionOrderByWithAggregationInput | PricingOptionOrderByWithAggregationInput[]
    by: PricingOptionScalarFieldEnum[] | PricingOptionScalarFieldEnum
    having?: PricingOptionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PricingOptionCountAggregateInputType | true
    _avg?: PricingOptionAvgAggregateInputType
    _sum?: PricingOptionSumAggregateInputType
    _min?: PricingOptionMinAggregateInputType
    _max?: PricingOptionMaxAggregateInputType
  }

  export type PricingOptionGroupByOutputType = {
    id: string
    legacyId: string
    name: string
    description: string
    optionType: $Enums.PricingOptionType
    flatAmount: number | null
    percentRate: number | null
    unitLabel: string | null
    isVat: boolean
    isActive: boolean
    source: string
    createdAt: Date
    updatedAt: Date
    _count: PricingOptionCountAggregateOutputType | null
    _avg: PricingOptionAvgAggregateOutputType | null
    _sum: PricingOptionSumAggregateOutputType | null
    _min: PricingOptionMinAggregateOutputType | null
    _max: PricingOptionMaxAggregateOutputType | null
  }

  type GetPricingOptionGroupByPayload<T extends PricingOptionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PricingOptionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PricingOptionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PricingOptionGroupByOutputType[P]>
            : GetScalarType<T[P], PricingOptionGroupByOutputType[P]>
        }
      >
    >


  export type PricingOptionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    legacyId?: boolean
    name?: boolean
    description?: boolean
    optionType?: boolean
    flatAmount?: boolean
    percentRate?: boolean
    unitLabel?: boolean
    isVat?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quoteAdjustments?: boolean | PricingOption$quoteAdjustmentsArgs<ExtArgs>
    _count?: boolean | PricingOptionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pricingOption"]>

  export type PricingOptionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    legacyId?: boolean
    name?: boolean
    description?: boolean
    optionType?: boolean
    flatAmount?: boolean
    percentRate?: boolean
    unitLabel?: boolean
    isVat?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pricingOption"]>

  export type PricingOptionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    legacyId?: boolean
    name?: boolean
    description?: boolean
    optionType?: boolean
    flatAmount?: boolean
    percentRate?: boolean
    unitLabel?: boolean
    isVat?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pricingOption"]>

  export type PricingOptionSelectScalar = {
    id?: boolean
    legacyId?: boolean
    name?: boolean
    description?: boolean
    optionType?: boolean
    flatAmount?: boolean
    percentRate?: boolean
    unitLabel?: boolean
    isVat?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PricingOptionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "legacyId" | "name" | "description" | "optionType" | "flatAmount" | "percentRate" | "unitLabel" | "isVat" | "isActive" | "source" | "createdAt" | "updatedAt", ExtArgs["result"]["pricingOption"]>
  export type PricingOptionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quoteAdjustments?: boolean | PricingOption$quoteAdjustmentsArgs<ExtArgs>
    _count?: boolean | PricingOptionCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PricingOptionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type PricingOptionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $PricingOptionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PricingOption"
    objects: {
      quoteAdjustments: Prisma.$QuoteAdjustmentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      legacyId: string
      name: string
      description: string
      optionType: $Enums.PricingOptionType
      flatAmount: number | null
      percentRate: number | null
      unitLabel: string | null
      isVat: boolean
      isActive: boolean
      source: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["pricingOption"]>
    composites: {}
  }

  type PricingOptionGetPayload<S extends boolean | null | undefined | PricingOptionDefaultArgs> = $Result.GetResult<Prisma.$PricingOptionPayload, S>

  type PricingOptionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PricingOptionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PricingOptionCountAggregateInputType | true
    }

  export interface PricingOptionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PricingOption'], meta: { name: 'PricingOption' } }
    /**
     * Find zero or one PricingOption that matches the filter.
     * @param {PricingOptionFindUniqueArgs} args - Arguments to find a PricingOption
     * @example
     * // Get one PricingOption
     * const pricingOption = await prisma.pricingOption.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PricingOptionFindUniqueArgs>(args: SelectSubset<T, PricingOptionFindUniqueArgs<ExtArgs>>): Prisma__PricingOptionClient<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PricingOption that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PricingOptionFindUniqueOrThrowArgs} args - Arguments to find a PricingOption
     * @example
     * // Get one PricingOption
     * const pricingOption = await prisma.pricingOption.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PricingOptionFindUniqueOrThrowArgs>(args: SelectSubset<T, PricingOptionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PricingOptionClient<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PricingOption that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingOptionFindFirstArgs} args - Arguments to find a PricingOption
     * @example
     * // Get one PricingOption
     * const pricingOption = await prisma.pricingOption.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PricingOptionFindFirstArgs>(args?: SelectSubset<T, PricingOptionFindFirstArgs<ExtArgs>>): Prisma__PricingOptionClient<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PricingOption that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingOptionFindFirstOrThrowArgs} args - Arguments to find a PricingOption
     * @example
     * // Get one PricingOption
     * const pricingOption = await prisma.pricingOption.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PricingOptionFindFirstOrThrowArgs>(args?: SelectSubset<T, PricingOptionFindFirstOrThrowArgs<ExtArgs>>): Prisma__PricingOptionClient<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PricingOptions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingOptionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PricingOptions
     * const pricingOptions = await prisma.pricingOption.findMany()
     * 
     * // Get first 10 PricingOptions
     * const pricingOptions = await prisma.pricingOption.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pricingOptionWithIdOnly = await prisma.pricingOption.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PricingOptionFindManyArgs>(args?: SelectSubset<T, PricingOptionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PricingOption.
     * @param {PricingOptionCreateArgs} args - Arguments to create a PricingOption.
     * @example
     * // Create one PricingOption
     * const PricingOption = await prisma.pricingOption.create({
     *   data: {
     *     // ... data to create a PricingOption
     *   }
     * })
     * 
     */
    create<T extends PricingOptionCreateArgs>(args: SelectSubset<T, PricingOptionCreateArgs<ExtArgs>>): Prisma__PricingOptionClient<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PricingOptions.
     * @param {PricingOptionCreateManyArgs} args - Arguments to create many PricingOptions.
     * @example
     * // Create many PricingOptions
     * const pricingOption = await prisma.pricingOption.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PricingOptionCreateManyArgs>(args?: SelectSubset<T, PricingOptionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PricingOptions and returns the data saved in the database.
     * @param {PricingOptionCreateManyAndReturnArgs} args - Arguments to create many PricingOptions.
     * @example
     * // Create many PricingOptions
     * const pricingOption = await prisma.pricingOption.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PricingOptions and only return the `id`
     * const pricingOptionWithIdOnly = await prisma.pricingOption.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PricingOptionCreateManyAndReturnArgs>(args?: SelectSubset<T, PricingOptionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PricingOption.
     * @param {PricingOptionDeleteArgs} args - Arguments to delete one PricingOption.
     * @example
     * // Delete one PricingOption
     * const PricingOption = await prisma.pricingOption.delete({
     *   where: {
     *     // ... filter to delete one PricingOption
     *   }
     * })
     * 
     */
    delete<T extends PricingOptionDeleteArgs>(args: SelectSubset<T, PricingOptionDeleteArgs<ExtArgs>>): Prisma__PricingOptionClient<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PricingOption.
     * @param {PricingOptionUpdateArgs} args - Arguments to update one PricingOption.
     * @example
     * // Update one PricingOption
     * const pricingOption = await prisma.pricingOption.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PricingOptionUpdateArgs>(args: SelectSubset<T, PricingOptionUpdateArgs<ExtArgs>>): Prisma__PricingOptionClient<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PricingOptions.
     * @param {PricingOptionDeleteManyArgs} args - Arguments to filter PricingOptions to delete.
     * @example
     * // Delete a few PricingOptions
     * const { count } = await prisma.pricingOption.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PricingOptionDeleteManyArgs>(args?: SelectSubset<T, PricingOptionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PricingOptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingOptionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PricingOptions
     * const pricingOption = await prisma.pricingOption.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PricingOptionUpdateManyArgs>(args: SelectSubset<T, PricingOptionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PricingOptions and returns the data updated in the database.
     * @param {PricingOptionUpdateManyAndReturnArgs} args - Arguments to update many PricingOptions.
     * @example
     * // Update many PricingOptions
     * const pricingOption = await prisma.pricingOption.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PricingOptions and only return the `id`
     * const pricingOptionWithIdOnly = await prisma.pricingOption.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PricingOptionUpdateManyAndReturnArgs>(args: SelectSubset<T, PricingOptionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PricingOption.
     * @param {PricingOptionUpsertArgs} args - Arguments to update or create a PricingOption.
     * @example
     * // Update or create a PricingOption
     * const pricingOption = await prisma.pricingOption.upsert({
     *   create: {
     *     // ... data to create a PricingOption
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PricingOption we want to update
     *   }
     * })
     */
    upsert<T extends PricingOptionUpsertArgs>(args: SelectSubset<T, PricingOptionUpsertArgs<ExtArgs>>): Prisma__PricingOptionClient<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PricingOptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingOptionCountArgs} args - Arguments to filter PricingOptions to count.
     * @example
     * // Count the number of PricingOptions
     * const count = await prisma.pricingOption.count({
     *   where: {
     *     // ... the filter for the PricingOptions we want to count
     *   }
     * })
    **/
    count<T extends PricingOptionCountArgs>(
      args?: Subset<T, PricingOptionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PricingOptionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PricingOption.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingOptionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PricingOptionAggregateArgs>(args: Subset<T, PricingOptionAggregateArgs>): Prisma.PrismaPromise<GetPricingOptionAggregateType<T>>

    /**
     * Group by PricingOption.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingOptionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PricingOptionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PricingOptionGroupByArgs['orderBy'] }
        : { orderBy?: PricingOptionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PricingOptionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPricingOptionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PricingOption model
   */
  readonly fields: PricingOptionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PricingOption.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PricingOptionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quoteAdjustments<T extends PricingOption$quoteAdjustmentsArgs<ExtArgs> = {}>(args?: Subset<T, PricingOption$quoteAdjustmentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PricingOption model
   */
  interface PricingOptionFieldRefs {
    readonly id: FieldRef<"PricingOption", 'String'>
    readonly legacyId: FieldRef<"PricingOption", 'String'>
    readonly name: FieldRef<"PricingOption", 'String'>
    readonly description: FieldRef<"PricingOption", 'String'>
    readonly optionType: FieldRef<"PricingOption", 'PricingOptionType'>
    readonly flatAmount: FieldRef<"PricingOption", 'Int'>
    readonly percentRate: FieldRef<"PricingOption", 'Int'>
    readonly unitLabel: FieldRef<"PricingOption", 'String'>
    readonly isVat: FieldRef<"PricingOption", 'Boolean'>
    readonly isActive: FieldRef<"PricingOption", 'Boolean'>
    readonly source: FieldRef<"PricingOption", 'String'>
    readonly createdAt: FieldRef<"PricingOption", 'DateTime'>
    readonly updatedAt: FieldRef<"PricingOption", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PricingOption findUnique
   */
  export type PricingOptionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
    /**
     * Filter, which PricingOption to fetch.
     */
    where: PricingOptionWhereUniqueInput
  }

  /**
   * PricingOption findUniqueOrThrow
   */
  export type PricingOptionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
    /**
     * Filter, which PricingOption to fetch.
     */
    where: PricingOptionWhereUniqueInput
  }

  /**
   * PricingOption findFirst
   */
  export type PricingOptionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
    /**
     * Filter, which PricingOption to fetch.
     */
    where?: PricingOptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingOptions to fetch.
     */
    orderBy?: PricingOptionOrderByWithRelationInput | PricingOptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PricingOptions.
     */
    cursor?: PricingOptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingOptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingOptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PricingOptions.
     */
    distinct?: PricingOptionScalarFieldEnum | PricingOptionScalarFieldEnum[]
  }

  /**
   * PricingOption findFirstOrThrow
   */
  export type PricingOptionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
    /**
     * Filter, which PricingOption to fetch.
     */
    where?: PricingOptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingOptions to fetch.
     */
    orderBy?: PricingOptionOrderByWithRelationInput | PricingOptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PricingOptions.
     */
    cursor?: PricingOptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingOptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingOptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PricingOptions.
     */
    distinct?: PricingOptionScalarFieldEnum | PricingOptionScalarFieldEnum[]
  }

  /**
   * PricingOption findMany
   */
  export type PricingOptionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
    /**
     * Filter, which PricingOptions to fetch.
     */
    where?: PricingOptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingOptions to fetch.
     */
    orderBy?: PricingOptionOrderByWithRelationInput | PricingOptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PricingOptions.
     */
    cursor?: PricingOptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingOptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingOptions.
     */
    skip?: number
    distinct?: PricingOptionScalarFieldEnum | PricingOptionScalarFieldEnum[]
  }

  /**
   * PricingOption create
   */
  export type PricingOptionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
    /**
     * The data needed to create a PricingOption.
     */
    data: XOR<PricingOptionCreateInput, PricingOptionUncheckedCreateInput>
  }

  /**
   * PricingOption createMany
   */
  export type PricingOptionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PricingOptions.
     */
    data: PricingOptionCreateManyInput | PricingOptionCreateManyInput[]
  }

  /**
   * PricingOption createManyAndReturn
   */
  export type PricingOptionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * The data used to create many PricingOptions.
     */
    data: PricingOptionCreateManyInput | PricingOptionCreateManyInput[]
  }

  /**
   * PricingOption update
   */
  export type PricingOptionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
    /**
     * The data needed to update a PricingOption.
     */
    data: XOR<PricingOptionUpdateInput, PricingOptionUncheckedUpdateInput>
    /**
     * Choose, which PricingOption to update.
     */
    where: PricingOptionWhereUniqueInput
  }

  /**
   * PricingOption updateMany
   */
  export type PricingOptionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PricingOptions.
     */
    data: XOR<PricingOptionUpdateManyMutationInput, PricingOptionUncheckedUpdateManyInput>
    /**
     * Filter which PricingOptions to update
     */
    where?: PricingOptionWhereInput
    /**
     * Limit how many PricingOptions to update.
     */
    limit?: number
  }

  /**
   * PricingOption updateManyAndReturn
   */
  export type PricingOptionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * The data used to update PricingOptions.
     */
    data: XOR<PricingOptionUpdateManyMutationInput, PricingOptionUncheckedUpdateManyInput>
    /**
     * Filter which PricingOptions to update
     */
    where?: PricingOptionWhereInput
    /**
     * Limit how many PricingOptions to update.
     */
    limit?: number
  }

  /**
   * PricingOption upsert
   */
  export type PricingOptionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
    /**
     * The filter to search for the PricingOption to update in case it exists.
     */
    where: PricingOptionWhereUniqueInput
    /**
     * In case the PricingOption found by the `where` argument doesn't exist, create a new PricingOption with this data.
     */
    create: XOR<PricingOptionCreateInput, PricingOptionUncheckedCreateInput>
    /**
     * In case the PricingOption was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PricingOptionUpdateInput, PricingOptionUncheckedUpdateInput>
  }

  /**
   * PricingOption delete
   */
  export type PricingOptionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
    /**
     * Filter which PricingOption to delete.
     */
    where: PricingOptionWhereUniqueInput
  }

  /**
   * PricingOption deleteMany
   */
  export type PricingOptionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PricingOptions to delete
     */
    where?: PricingOptionWhereInput
    /**
     * Limit how many PricingOptions to delete.
     */
    limit?: number
  }

  /**
   * PricingOption.quoteAdjustments
   */
  export type PricingOption$quoteAdjustmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    where?: QuoteAdjustmentWhereInput
    orderBy?: QuoteAdjustmentOrderByWithRelationInput | QuoteAdjustmentOrderByWithRelationInput[]
    cursor?: QuoteAdjustmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuoteAdjustmentScalarFieldEnum | QuoteAdjustmentScalarFieldEnum[]
  }

  /**
   * PricingOption without action
   */
  export type PricingOptionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
  }


  /**
   * Model PricingRule
   */

  export type AggregatePricingRule = {
    _count: PricingRuleCountAggregateOutputType | null
    _avg: PricingRuleAvgAggregateOutputType | null
    _sum: PricingRuleSumAggregateOutputType | null
    _min: PricingRuleMinAggregateOutputType | null
    _max: PricingRuleMaxAggregateOutputType | null
  }

  export type PricingRuleAvgAggregateOutputType = {
    numericValue: number | null
    percentValue: number | null
  }

  export type PricingRuleSumAggregateOutputType = {
    numericValue: number | null
    percentValue: number | null
  }

  export type PricingRuleMinAggregateOutputType = {
    id: string | null
    code: string | null
    ruleType: $Enums.PricingRuleType | null
    label: string | null
    description: string | null
    numericValue: number | null
    percentValue: number | null
    jsonValue: string | null
    isDefault: boolean | null
    isActive: boolean | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PricingRuleMaxAggregateOutputType = {
    id: string | null
    code: string | null
    ruleType: $Enums.PricingRuleType | null
    label: string | null
    description: string | null
    numericValue: number | null
    percentValue: number | null
    jsonValue: string | null
    isDefault: boolean | null
    isActive: boolean | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PricingRuleCountAggregateOutputType = {
    id: number
    code: number
    ruleType: number
    label: number
    description: number
    numericValue: number
    percentValue: number
    jsonValue: number
    isDefault: number
    isActive: number
    source: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PricingRuleAvgAggregateInputType = {
    numericValue?: true
    percentValue?: true
  }

  export type PricingRuleSumAggregateInputType = {
    numericValue?: true
    percentValue?: true
  }

  export type PricingRuleMinAggregateInputType = {
    id?: true
    code?: true
    ruleType?: true
    label?: true
    description?: true
    numericValue?: true
    percentValue?: true
    jsonValue?: true
    isDefault?: true
    isActive?: true
    source?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PricingRuleMaxAggregateInputType = {
    id?: true
    code?: true
    ruleType?: true
    label?: true
    description?: true
    numericValue?: true
    percentValue?: true
    jsonValue?: true
    isDefault?: true
    isActive?: true
    source?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PricingRuleCountAggregateInputType = {
    id?: true
    code?: true
    ruleType?: true
    label?: true
    description?: true
    numericValue?: true
    percentValue?: true
    jsonValue?: true
    isDefault?: true
    isActive?: true
    source?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PricingRuleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PricingRule to aggregate.
     */
    where?: PricingRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingRules to fetch.
     */
    orderBy?: PricingRuleOrderByWithRelationInput | PricingRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PricingRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PricingRules
    **/
    _count?: true | PricingRuleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PricingRuleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PricingRuleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PricingRuleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PricingRuleMaxAggregateInputType
  }

  export type GetPricingRuleAggregateType<T extends PricingRuleAggregateArgs> = {
        [P in keyof T & keyof AggregatePricingRule]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePricingRule[P]>
      : GetScalarType<T[P], AggregatePricingRule[P]>
  }




  export type PricingRuleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PricingRuleWhereInput
    orderBy?: PricingRuleOrderByWithAggregationInput | PricingRuleOrderByWithAggregationInput[]
    by: PricingRuleScalarFieldEnum[] | PricingRuleScalarFieldEnum
    having?: PricingRuleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PricingRuleCountAggregateInputType | true
    _avg?: PricingRuleAvgAggregateInputType
    _sum?: PricingRuleSumAggregateInputType
    _min?: PricingRuleMinAggregateInputType
    _max?: PricingRuleMaxAggregateInputType
  }

  export type PricingRuleGroupByOutputType = {
    id: string
    code: string
    ruleType: $Enums.PricingRuleType
    label: string
    description: string | null
    numericValue: number | null
    percentValue: number | null
    jsonValue: string | null
    isDefault: boolean
    isActive: boolean
    source: string
    createdAt: Date
    updatedAt: Date
    _count: PricingRuleCountAggregateOutputType | null
    _avg: PricingRuleAvgAggregateOutputType | null
    _sum: PricingRuleSumAggregateOutputType | null
    _min: PricingRuleMinAggregateOutputType | null
    _max: PricingRuleMaxAggregateOutputType | null
  }

  type GetPricingRuleGroupByPayload<T extends PricingRuleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PricingRuleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PricingRuleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PricingRuleGroupByOutputType[P]>
            : GetScalarType<T[P], PricingRuleGroupByOutputType[P]>
        }
      >
    >


  export type PricingRuleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    ruleType?: boolean
    label?: boolean
    description?: boolean
    numericValue?: boolean
    percentValue?: boolean
    jsonValue?: boolean
    isDefault?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pricingRule"]>

  export type PricingRuleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    ruleType?: boolean
    label?: boolean
    description?: boolean
    numericValue?: boolean
    percentValue?: boolean
    jsonValue?: boolean
    isDefault?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pricingRule"]>

  export type PricingRuleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    ruleType?: boolean
    label?: boolean
    description?: boolean
    numericValue?: boolean
    percentValue?: boolean
    jsonValue?: boolean
    isDefault?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pricingRule"]>

  export type PricingRuleSelectScalar = {
    id?: boolean
    code?: boolean
    ruleType?: boolean
    label?: boolean
    description?: boolean
    numericValue?: boolean
    percentValue?: boolean
    jsonValue?: boolean
    isDefault?: boolean
    isActive?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PricingRuleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "code" | "ruleType" | "label" | "description" | "numericValue" | "percentValue" | "jsonValue" | "isDefault" | "isActive" | "source" | "createdAt" | "updatedAt", ExtArgs["result"]["pricingRule"]>

  export type $PricingRulePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PricingRule"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      code: string
      ruleType: $Enums.PricingRuleType
      label: string
      description: string | null
      numericValue: number | null
      percentValue: number | null
      jsonValue: string | null
      isDefault: boolean
      isActive: boolean
      source: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["pricingRule"]>
    composites: {}
  }

  type PricingRuleGetPayload<S extends boolean | null | undefined | PricingRuleDefaultArgs> = $Result.GetResult<Prisma.$PricingRulePayload, S>

  type PricingRuleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PricingRuleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PricingRuleCountAggregateInputType | true
    }

  export interface PricingRuleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PricingRule'], meta: { name: 'PricingRule' } }
    /**
     * Find zero or one PricingRule that matches the filter.
     * @param {PricingRuleFindUniqueArgs} args - Arguments to find a PricingRule
     * @example
     * // Get one PricingRule
     * const pricingRule = await prisma.pricingRule.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PricingRuleFindUniqueArgs>(args: SelectSubset<T, PricingRuleFindUniqueArgs<ExtArgs>>): Prisma__PricingRuleClient<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PricingRule that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PricingRuleFindUniqueOrThrowArgs} args - Arguments to find a PricingRule
     * @example
     * // Get one PricingRule
     * const pricingRule = await prisma.pricingRule.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PricingRuleFindUniqueOrThrowArgs>(args: SelectSubset<T, PricingRuleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PricingRuleClient<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PricingRule that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingRuleFindFirstArgs} args - Arguments to find a PricingRule
     * @example
     * // Get one PricingRule
     * const pricingRule = await prisma.pricingRule.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PricingRuleFindFirstArgs>(args?: SelectSubset<T, PricingRuleFindFirstArgs<ExtArgs>>): Prisma__PricingRuleClient<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PricingRule that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingRuleFindFirstOrThrowArgs} args - Arguments to find a PricingRule
     * @example
     * // Get one PricingRule
     * const pricingRule = await prisma.pricingRule.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PricingRuleFindFirstOrThrowArgs>(args?: SelectSubset<T, PricingRuleFindFirstOrThrowArgs<ExtArgs>>): Prisma__PricingRuleClient<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PricingRules that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingRuleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PricingRules
     * const pricingRules = await prisma.pricingRule.findMany()
     * 
     * // Get first 10 PricingRules
     * const pricingRules = await prisma.pricingRule.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pricingRuleWithIdOnly = await prisma.pricingRule.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PricingRuleFindManyArgs>(args?: SelectSubset<T, PricingRuleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PricingRule.
     * @param {PricingRuleCreateArgs} args - Arguments to create a PricingRule.
     * @example
     * // Create one PricingRule
     * const PricingRule = await prisma.pricingRule.create({
     *   data: {
     *     // ... data to create a PricingRule
     *   }
     * })
     * 
     */
    create<T extends PricingRuleCreateArgs>(args: SelectSubset<T, PricingRuleCreateArgs<ExtArgs>>): Prisma__PricingRuleClient<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PricingRules.
     * @param {PricingRuleCreateManyArgs} args - Arguments to create many PricingRules.
     * @example
     * // Create many PricingRules
     * const pricingRule = await prisma.pricingRule.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PricingRuleCreateManyArgs>(args?: SelectSubset<T, PricingRuleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PricingRules and returns the data saved in the database.
     * @param {PricingRuleCreateManyAndReturnArgs} args - Arguments to create many PricingRules.
     * @example
     * // Create many PricingRules
     * const pricingRule = await prisma.pricingRule.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PricingRules and only return the `id`
     * const pricingRuleWithIdOnly = await prisma.pricingRule.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PricingRuleCreateManyAndReturnArgs>(args?: SelectSubset<T, PricingRuleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PricingRule.
     * @param {PricingRuleDeleteArgs} args - Arguments to delete one PricingRule.
     * @example
     * // Delete one PricingRule
     * const PricingRule = await prisma.pricingRule.delete({
     *   where: {
     *     // ... filter to delete one PricingRule
     *   }
     * })
     * 
     */
    delete<T extends PricingRuleDeleteArgs>(args: SelectSubset<T, PricingRuleDeleteArgs<ExtArgs>>): Prisma__PricingRuleClient<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PricingRule.
     * @param {PricingRuleUpdateArgs} args - Arguments to update one PricingRule.
     * @example
     * // Update one PricingRule
     * const pricingRule = await prisma.pricingRule.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PricingRuleUpdateArgs>(args: SelectSubset<T, PricingRuleUpdateArgs<ExtArgs>>): Prisma__PricingRuleClient<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PricingRules.
     * @param {PricingRuleDeleteManyArgs} args - Arguments to filter PricingRules to delete.
     * @example
     * // Delete a few PricingRules
     * const { count } = await prisma.pricingRule.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PricingRuleDeleteManyArgs>(args?: SelectSubset<T, PricingRuleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PricingRules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingRuleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PricingRules
     * const pricingRule = await prisma.pricingRule.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PricingRuleUpdateManyArgs>(args: SelectSubset<T, PricingRuleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PricingRules and returns the data updated in the database.
     * @param {PricingRuleUpdateManyAndReturnArgs} args - Arguments to update many PricingRules.
     * @example
     * // Update many PricingRules
     * const pricingRule = await prisma.pricingRule.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PricingRules and only return the `id`
     * const pricingRuleWithIdOnly = await prisma.pricingRule.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PricingRuleUpdateManyAndReturnArgs>(args: SelectSubset<T, PricingRuleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PricingRule.
     * @param {PricingRuleUpsertArgs} args - Arguments to update or create a PricingRule.
     * @example
     * // Update or create a PricingRule
     * const pricingRule = await prisma.pricingRule.upsert({
     *   create: {
     *     // ... data to create a PricingRule
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PricingRule we want to update
     *   }
     * })
     */
    upsert<T extends PricingRuleUpsertArgs>(args: SelectSubset<T, PricingRuleUpsertArgs<ExtArgs>>): Prisma__PricingRuleClient<$Result.GetResult<Prisma.$PricingRulePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PricingRules.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingRuleCountArgs} args - Arguments to filter PricingRules to count.
     * @example
     * // Count the number of PricingRules
     * const count = await prisma.pricingRule.count({
     *   where: {
     *     // ... the filter for the PricingRules we want to count
     *   }
     * })
    **/
    count<T extends PricingRuleCountArgs>(
      args?: Subset<T, PricingRuleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PricingRuleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PricingRule.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingRuleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PricingRuleAggregateArgs>(args: Subset<T, PricingRuleAggregateArgs>): Prisma.PrismaPromise<GetPricingRuleAggregateType<T>>

    /**
     * Group by PricingRule.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingRuleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PricingRuleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PricingRuleGroupByArgs['orderBy'] }
        : { orderBy?: PricingRuleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PricingRuleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPricingRuleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PricingRule model
   */
  readonly fields: PricingRuleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PricingRule.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PricingRuleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PricingRule model
   */
  interface PricingRuleFieldRefs {
    readonly id: FieldRef<"PricingRule", 'String'>
    readonly code: FieldRef<"PricingRule", 'String'>
    readonly ruleType: FieldRef<"PricingRule", 'PricingRuleType'>
    readonly label: FieldRef<"PricingRule", 'String'>
    readonly description: FieldRef<"PricingRule", 'String'>
    readonly numericValue: FieldRef<"PricingRule", 'Int'>
    readonly percentValue: FieldRef<"PricingRule", 'Int'>
    readonly jsonValue: FieldRef<"PricingRule", 'String'>
    readonly isDefault: FieldRef<"PricingRule", 'Boolean'>
    readonly isActive: FieldRef<"PricingRule", 'Boolean'>
    readonly source: FieldRef<"PricingRule", 'String'>
    readonly createdAt: FieldRef<"PricingRule", 'DateTime'>
    readonly updatedAt: FieldRef<"PricingRule", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PricingRule findUnique
   */
  export type PricingRuleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * Filter, which PricingRule to fetch.
     */
    where: PricingRuleWhereUniqueInput
  }

  /**
   * PricingRule findUniqueOrThrow
   */
  export type PricingRuleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * Filter, which PricingRule to fetch.
     */
    where: PricingRuleWhereUniqueInput
  }

  /**
   * PricingRule findFirst
   */
  export type PricingRuleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * Filter, which PricingRule to fetch.
     */
    where?: PricingRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingRules to fetch.
     */
    orderBy?: PricingRuleOrderByWithRelationInput | PricingRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PricingRules.
     */
    cursor?: PricingRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PricingRules.
     */
    distinct?: PricingRuleScalarFieldEnum | PricingRuleScalarFieldEnum[]
  }

  /**
   * PricingRule findFirstOrThrow
   */
  export type PricingRuleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * Filter, which PricingRule to fetch.
     */
    where?: PricingRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingRules to fetch.
     */
    orderBy?: PricingRuleOrderByWithRelationInput | PricingRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PricingRules.
     */
    cursor?: PricingRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingRules.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PricingRules.
     */
    distinct?: PricingRuleScalarFieldEnum | PricingRuleScalarFieldEnum[]
  }

  /**
   * PricingRule findMany
   */
  export type PricingRuleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * Filter, which PricingRules to fetch.
     */
    where?: PricingRuleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingRules to fetch.
     */
    orderBy?: PricingRuleOrderByWithRelationInput | PricingRuleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PricingRules.
     */
    cursor?: PricingRuleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingRules from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingRules.
     */
    skip?: number
    distinct?: PricingRuleScalarFieldEnum | PricingRuleScalarFieldEnum[]
  }

  /**
   * PricingRule create
   */
  export type PricingRuleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * The data needed to create a PricingRule.
     */
    data: XOR<PricingRuleCreateInput, PricingRuleUncheckedCreateInput>
  }

  /**
   * PricingRule createMany
   */
  export type PricingRuleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PricingRules.
     */
    data: PricingRuleCreateManyInput | PricingRuleCreateManyInput[]
  }

  /**
   * PricingRule createManyAndReturn
   */
  export type PricingRuleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * The data used to create many PricingRules.
     */
    data: PricingRuleCreateManyInput | PricingRuleCreateManyInput[]
  }

  /**
   * PricingRule update
   */
  export type PricingRuleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * The data needed to update a PricingRule.
     */
    data: XOR<PricingRuleUpdateInput, PricingRuleUncheckedUpdateInput>
    /**
     * Choose, which PricingRule to update.
     */
    where: PricingRuleWhereUniqueInput
  }

  /**
   * PricingRule updateMany
   */
  export type PricingRuleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PricingRules.
     */
    data: XOR<PricingRuleUpdateManyMutationInput, PricingRuleUncheckedUpdateManyInput>
    /**
     * Filter which PricingRules to update
     */
    where?: PricingRuleWhereInput
    /**
     * Limit how many PricingRules to update.
     */
    limit?: number
  }

  /**
   * PricingRule updateManyAndReturn
   */
  export type PricingRuleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * The data used to update PricingRules.
     */
    data: XOR<PricingRuleUpdateManyMutationInput, PricingRuleUncheckedUpdateManyInput>
    /**
     * Filter which PricingRules to update
     */
    where?: PricingRuleWhereInput
    /**
     * Limit how many PricingRules to update.
     */
    limit?: number
  }

  /**
   * PricingRule upsert
   */
  export type PricingRuleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * The filter to search for the PricingRule to update in case it exists.
     */
    where: PricingRuleWhereUniqueInput
    /**
     * In case the PricingRule found by the `where` argument doesn't exist, create a new PricingRule with this data.
     */
    create: XOR<PricingRuleCreateInput, PricingRuleUncheckedCreateInput>
    /**
     * In case the PricingRule was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PricingRuleUpdateInput, PricingRuleUncheckedUpdateInput>
  }

  /**
   * PricingRule delete
   */
  export type PricingRuleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
    /**
     * Filter which PricingRule to delete.
     */
    where: PricingRuleWhereUniqueInput
  }

  /**
   * PricingRule deleteMany
   */
  export type PricingRuleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PricingRules to delete
     */
    where?: PricingRuleWhereInput
    /**
     * Limit how many PricingRules to delete.
     */
    limit?: number
  }

  /**
   * PricingRule without action
   */
  export type PricingRuleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingRule
     */
    select?: PricingRuleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingRule
     */
    omit?: PricingRuleOmit<ExtArgs> | null
  }


  /**
   * Model Quote
   */

  export type AggregateQuote = {
    _count: QuoteCountAggregateOutputType | null
    _avg: QuoteAvgAggregateOutputType | null
    _sum: QuoteSumAggregateOutputType | null
    _min: QuoteMinAggregateOutputType | null
    _max: QuoteMaxAggregateOutputType | null
  }

  export type QuoteAvgAggregateOutputType = {
    serviceBaseMin: number | null
    serviceBaseMax: number | null
    subtotalMin: number | null
    subtotalMax: number | null
    vatAmountMin: number | null
    vatAmountMax: number | null
    totalMin: number | null
    totalMax: number | null
    consultFee: number | null
  }

  export type QuoteSumAggregateOutputType = {
    serviceBaseMin: number | null
    serviceBaseMax: number | null
    subtotalMin: number | null
    subtotalMax: number | null
    vatAmountMin: number | null
    vatAmountMax: number | null
    totalMin: number | null
    totalMax: number | null
    consultFee: number | null
  }

  export type QuoteMinAggregateOutputType = {
    id: string | null
    inquiryId: string | null
    status: $Enums.QuoteStatus | null
    selectedServiceLegacyIds: string | null
    selectedOptionLegacyIds: string | null
    urgencyRuleCode: string | null
    consultRuleCode: string | null
    paymentRuleCode: string | null
    rangeMode: boolean | null
    serviceBaseMin: number | null
    serviceBaseMax: number | null
    subtotalMin: number | null
    subtotalMax: number | null
    vatAmountMin: number | null
    vatAmountMax: number | null
    totalMin: number | null
    totalMax: number | null
    consultFee: number | null
    successFeeRestricted: boolean | null
    draftNotes: string | null
    calculationSummary: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuoteMaxAggregateOutputType = {
    id: string | null
    inquiryId: string | null
    status: $Enums.QuoteStatus | null
    selectedServiceLegacyIds: string | null
    selectedOptionLegacyIds: string | null
    urgencyRuleCode: string | null
    consultRuleCode: string | null
    paymentRuleCode: string | null
    rangeMode: boolean | null
    serviceBaseMin: number | null
    serviceBaseMax: number | null
    subtotalMin: number | null
    subtotalMax: number | null
    vatAmountMin: number | null
    vatAmountMax: number | null
    totalMin: number | null
    totalMax: number | null
    consultFee: number | null
    successFeeRestricted: boolean | null
    draftNotes: string | null
    calculationSummary: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuoteCountAggregateOutputType = {
    id: number
    inquiryId: number
    status: number
    selectedServiceLegacyIds: number
    selectedOptionLegacyIds: number
    urgencyRuleCode: number
    consultRuleCode: number
    paymentRuleCode: number
    rangeMode: number
    serviceBaseMin: number
    serviceBaseMax: number
    subtotalMin: number
    subtotalMax: number
    vatAmountMin: number
    vatAmountMax: number
    totalMin: number
    totalMax: number
    consultFee: number
    successFeeRestricted: number
    draftNotes: number
    calculationSummary: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type QuoteAvgAggregateInputType = {
    serviceBaseMin?: true
    serviceBaseMax?: true
    subtotalMin?: true
    subtotalMax?: true
    vatAmountMin?: true
    vatAmountMax?: true
    totalMin?: true
    totalMax?: true
    consultFee?: true
  }

  export type QuoteSumAggregateInputType = {
    serviceBaseMin?: true
    serviceBaseMax?: true
    subtotalMin?: true
    subtotalMax?: true
    vatAmountMin?: true
    vatAmountMax?: true
    totalMin?: true
    totalMax?: true
    consultFee?: true
  }

  export type QuoteMinAggregateInputType = {
    id?: true
    inquiryId?: true
    status?: true
    selectedServiceLegacyIds?: true
    selectedOptionLegacyIds?: true
    urgencyRuleCode?: true
    consultRuleCode?: true
    paymentRuleCode?: true
    rangeMode?: true
    serviceBaseMin?: true
    serviceBaseMax?: true
    subtotalMin?: true
    subtotalMax?: true
    vatAmountMin?: true
    vatAmountMax?: true
    totalMin?: true
    totalMax?: true
    consultFee?: true
    successFeeRestricted?: true
    draftNotes?: true
    calculationSummary?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuoteMaxAggregateInputType = {
    id?: true
    inquiryId?: true
    status?: true
    selectedServiceLegacyIds?: true
    selectedOptionLegacyIds?: true
    urgencyRuleCode?: true
    consultRuleCode?: true
    paymentRuleCode?: true
    rangeMode?: true
    serviceBaseMin?: true
    serviceBaseMax?: true
    subtotalMin?: true
    subtotalMax?: true
    vatAmountMin?: true
    vatAmountMax?: true
    totalMin?: true
    totalMax?: true
    consultFee?: true
    successFeeRestricted?: true
    draftNotes?: true
    calculationSummary?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuoteCountAggregateInputType = {
    id?: true
    inquiryId?: true
    status?: true
    selectedServiceLegacyIds?: true
    selectedOptionLegacyIds?: true
    urgencyRuleCode?: true
    consultRuleCode?: true
    paymentRuleCode?: true
    rangeMode?: true
    serviceBaseMin?: true
    serviceBaseMax?: true
    subtotalMin?: true
    subtotalMax?: true
    vatAmountMin?: true
    vatAmountMax?: true
    totalMin?: true
    totalMax?: true
    consultFee?: true
    successFeeRestricted?: true
    draftNotes?: true
    calculationSummary?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type QuoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Quote to aggregate.
     */
    where?: QuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotes to fetch.
     */
    orderBy?: QuoteOrderByWithRelationInput | QuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Quotes
    **/
    _count?: true | QuoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuoteAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuoteSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuoteMaxAggregateInputType
  }

  export type GetQuoteAggregateType<T extends QuoteAggregateArgs> = {
        [P in keyof T & keyof AggregateQuote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuote[P]>
      : GetScalarType<T[P], AggregateQuote[P]>
  }




  export type QuoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteWhereInput
    orderBy?: QuoteOrderByWithAggregationInput | QuoteOrderByWithAggregationInput[]
    by: QuoteScalarFieldEnum[] | QuoteScalarFieldEnum
    having?: QuoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuoteCountAggregateInputType | true
    _avg?: QuoteAvgAggregateInputType
    _sum?: QuoteSumAggregateInputType
    _min?: QuoteMinAggregateInputType
    _max?: QuoteMaxAggregateInputType
  }

  export type QuoteGroupByOutputType = {
    id: string
    inquiryId: string
    status: $Enums.QuoteStatus
    selectedServiceLegacyIds: string
    selectedOptionLegacyIds: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode: string
    rangeMode: boolean
    serviceBaseMin: number
    serviceBaseMax: number
    subtotalMin: number
    subtotalMax: number
    vatAmountMin: number
    vatAmountMax: number
    totalMin: number
    totalMax: number
    consultFee: number
    successFeeRestricted: boolean
    draftNotes: string | null
    calculationSummary: string | null
    createdAt: Date
    updatedAt: Date
    _count: QuoteCountAggregateOutputType | null
    _avg: QuoteAvgAggregateOutputType | null
    _sum: QuoteSumAggregateOutputType | null
    _min: QuoteMinAggregateOutputType | null
    _max: QuoteMaxAggregateOutputType | null
  }

  type GetQuoteGroupByPayload<T extends QuoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuoteGroupByOutputType[P]>
            : GetScalarType<T[P], QuoteGroupByOutputType[P]>
        }
      >
    >


  export type QuoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inquiryId?: boolean
    status?: boolean
    selectedServiceLegacyIds?: boolean
    selectedOptionLegacyIds?: boolean
    urgencyRuleCode?: boolean
    consultRuleCode?: boolean
    paymentRuleCode?: boolean
    rangeMode?: boolean
    serviceBaseMin?: boolean
    serviceBaseMax?: boolean
    subtotalMin?: boolean
    subtotalMax?: boolean
    vatAmountMin?: boolean
    vatAmountMax?: boolean
    totalMin?: boolean
    totalMax?: boolean
    consultFee?: boolean
    successFeeRestricted?: boolean
    draftNotes?: boolean
    calculationSummary?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
    lineItems?: boolean | Quote$lineItemsArgs<ExtArgs>
    adjustments?: boolean | Quote$adjustmentsArgs<ExtArgs>
    paymentPlans?: boolean | Quote$paymentPlansArgs<ExtArgs>
    contractDraft?: boolean | Quote$contractDraftArgs<ExtArgs>
    _count?: boolean | QuoteCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quote"]>

  export type QuoteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inquiryId?: boolean
    status?: boolean
    selectedServiceLegacyIds?: boolean
    selectedOptionLegacyIds?: boolean
    urgencyRuleCode?: boolean
    consultRuleCode?: boolean
    paymentRuleCode?: boolean
    rangeMode?: boolean
    serviceBaseMin?: boolean
    serviceBaseMax?: boolean
    subtotalMin?: boolean
    subtotalMax?: boolean
    vatAmountMin?: boolean
    vatAmountMax?: boolean
    totalMin?: boolean
    totalMax?: boolean
    consultFee?: boolean
    successFeeRestricted?: boolean
    draftNotes?: boolean
    calculationSummary?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quote"]>

  export type QuoteSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inquiryId?: boolean
    status?: boolean
    selectedServiceLegacyIds?: boolean
    selectedOptionLegacyIds?: boolean
    urgencyRuleCode?: boolean
    consultRuleCode?: boolean
    paymentRuleCode?: boolean
    rangeMode?: boolean
    serviceBaseMin?: boolean
    serviceBaseMax?: boolean
    subtotalMin?: boolean
    subtotalMax?: boolean
    vatAmountMin?: boolean
    vatAmountMax?: boolean
    totalMin?: boolean
    totalMax?: boolean
    consultFee?: boolean
    successFeeRestricted?: boolean
    draftNotes?: boolean
    calculationSummary?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["quote"]>

  export type QuoteSelectScalar = {
    id?: boolean
    inquiryId?: boolean
    status?: boolean
    selectedServiceLegacyIds?: boolean
    selectedOptionLegacyIds?: boolean
    urgencyRuleCode?: boolean
    consultRuleCode?: boolean
    paymentRuleCode?: boolean
    rangeMode?: boolean
    serviceBaseMin?: boolean
    serviceBaseMax?: boolean
    subtotalMin?: boolean
    subtotalMax?: boolean
    vatAmountMin?: boolean
    vatAmountMax?: boolean
    totalMin?: boolean
    totalMax?: boolean
    consultFee?: boolean
    successFeeRestricted?: boolean
    draftNotes?: boolean
    calculationSummary?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type QuoteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "inquiryId" | "status" | "selectedServiceLegacyIds" | "selectedOptionLegacyIds" | "urgencyRuleCode" | "consultRuleCode" | "paymentRuleCode" | "rangeMode" | "serviceBaseMin" | "serviceBaseMax" | "subtotalMin" | "subtotalMax" | "vatAmountMin" | "vatAmountMax" | "totalMin" | "totalMax" | "consultFee" | "successFeeRestricted" | "draftNotes" | "calculationSummary" | "createdAt" | "updatedAt", ExtArgs["result"]["quote"]>
  export type QuoteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
    lineItems?: boolean | Quote$lineItemsArgs<ExtArgs>
    adjustments?: boolean | Quote$adjustmentsArgs<ExtArgs>
    paymentPlans?: boolean | Quote$paymentPlansArgs<ExtArgs>
    contractDraft?: boolean | Quote$contractDraftArgs<ExtArgs>
    _count?: boolean | QuoteCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type QuoteIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
  }
  export type QuoteIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
  }

  export type $QuotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Quote"
    objects: {
      inquiry: Prisma.$InquiryPayload<ExtArgs>
      lineItems: Prisma.$QuoteLineItemPayload<ExtArgs>[]
      adjustments: Prisma.$QuoteAdjustmentPayload<ExtArgs>[]
      paymentPlans: Prisma.$PaymentPlanPayload<ExtArgs>[]
      contractDraft: Prisma.$ContractDraftPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      inquiryId: string
      status: $Enums.QuoteStatus
      selectedServiceLegacyIds: string
      selectedOptionLegacyIds: string
      urgencyRuleCode: string
      consultRuleCode: string
      paymentRuleCode: string
      rangeMode: boolean
      serviceBaseMin: number
      serviceBaseMax: number
      subtotalMin: number
      subtotalMax: number
      vatAmountMin: number
      vatAmountMax: number
      totalMin: number
      totalMax: number
      consultFee: number
      successFeeRestricted: boolean
      draftNotes: string | null
      calculationSummary: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["quote"]>
    composites: {}
  }

  type QuoteGetPayload<S extends boolean | null | undefined | QuoteDefaultArgs> = $Result.GetResult<Prisma.$QuotePayload, S>

  type QuoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QuoteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QuoteCountAggregateInputType | true
    }

  export interface QuoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Quote'], meta: { name: 'Quote' } }
    /**
     * Find zero or one Quote that matches the filter.
     * @param {QuoteFindUniqueArgs} args - Arguments to find a Quote
     * @example
     * // Get one Quote
     * const quote = await prisma.quote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuoteFindUniqueArgs>(args: SelectSubset<T, QuoteFindUniqueArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Quote that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QuoteFindUniqueOrThrowArgs} args - Arguments to find a Quote
     * @example
     * // Get one Quote
     * const quote = await prisma.quote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuoteFindUniqueOrThrowArgs>(args: SelectSubset<T, QuoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Quote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteFindFirstArgs} args - Arguments to find a Quote
     * @example
     * // Get one Quote
     * const quote = await prisma.quote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuoteFindFirstArgs>(args?: SelectSubset<T, QuoteFindFirstArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Quote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteFindFirstOrThrowArgs} args - Arguments to find a Quote
     * @example
     * // Get one Quote
     * const quote = await prisma.quote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuoteFindFirstOrThrowArgs>(args?: SelectSubset<T, QuoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Quotes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Quotes
     * const quotes = await prisma.quote.findMany()
     * 
     * // Get first 10 Quotes
     * const quotes = await prisma.quote.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quoteWithIdOnly = await prisma.quote.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuoteFindManyArgs>(args?: SelectSubset<T, QuoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Quote.
     * @param {QuoteCreateArgs} args - Arguments to create a Quote.
     * @example
     * // Create one Quote
     * const Quote = await prisma.quote.create({
     *   data: {
     *     // ... data to create a Quote
     *   }
     * })
     * 
     */
    create<T extends QuoteCreateArgs>(args: SelectSubset<T, QuoteCreateArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Quotes.
     * @param {QuoteCreateManyArgs} args - Arguments to create many Quotes.
     * @example
     * // Create many Quotes
     * const quote = await prisma.quote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuoteCreateManyArgs>(args?: SelectSubset<T, QuoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Quotes and returns the data saved in the database.
     * @param {QuoteCreateManyAndReturnArgs} args - Arguments to create many Quotes.
     * @example
     * // Create many Quotes
     * const quote = await prisma.quote.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Quotes and only return the `id`
     * const quoteWithIdOnly = await prisma.quote.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuoteCreateManyAndReturnArgs>(args?: SelectSubset<T, QuoteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Quote.
     * @param {QuoteDeleteArgs} args - Arguments to delete one Quote.
     * @example
     * // Delete one Quote
     * const Quote = await prisma.quote.delete({
     *   where: {
     *     // ... filter to delete one Quote
     *   }
     * })
     * 
     */
    delete<T extends QuoteDeleteArgs>(args: SelectSubset<T, QuoteDeleteArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Quote.
     * @param {QuoteUpdateArgs} args - Arguments to update one Quote.
     * @example
     * // Update one Quote
     * const quote = await prisma.quote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuoteUpdateArgs>(args: SelectSubset<T, QuoteUpdateArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Quotes.
     * @param {QuoteDeleteManyArgs} args - Arguments to filter Quotes to delete.
     * @example
     * // Delete a few Quotes
     * const { count } = await prisma.quote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuoteDeleteManyArgs>(args?: SelectSubset<T, QuoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Quotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Quotes
     * const quote = await prisma.quote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuoteUpdateManyArgs>(args: SelectSubset<T, QuoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Quotes and returns the data updated in the database.
     * @param {QuoteUpdateManyAndReturnArgs} args - Arguments to update many Quotes.
     * @example
     * // Update many Quotes
     * const quote = await prisma.quote.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Quotes and only return the `id`
     * const quoteWithIdOnly = await prisma.quote.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends QuoteUpdateManyAndReturnArgs>(args: SelectSubset<T, QuoteUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Quote.
     * @param {QuoteUpsertArgs} args - Arguments to update or create a Quote.
     * @example
     * // Update or create a Quote
     * const quote = await prisma.quote.upsert({
     *   create: {
     *     // ... data to create a Quote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Quote we want to update
     *   }
     * })
     */
    upsert<T extends QuoteUpsertArgs>(args: SelectSubset<T, QuoteUpsertArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Quotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteCountArgs} args - Arguments to filter Quotes to count.
     * @example
     * // Count the number of Quotes
     * const count = await prisma.quote.count({
     *   where: {
     *     // ... the filter for the Quotes we want to count
     *   }
     * })
    **/
    count<T extends QuoteCountArgs>(
      args?: Subset<T, QuoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Quote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuoteAggregateArgs>(args: Subset<T, QuoteAggregateArgs>): Prisma.PrismaPromise<GetQuoteAggregateType<T>>

    /**
     * Group by Quote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuoteGroupByArgs['orderBy'] }
        : { orderBy?: QuoteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Quote model
   */
  readonly fields: QuoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Quote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    inquiry<T extends InquiryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InquiryDefaultArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    lineItems<T extends Quote$lineItemsArgs<ExtArgs> = {}>(args?: Subset<T, Quote$lineItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    adjustments<T extends Quote$adjustmentsArgs<ExtArgs> = {}>(args?: Subset<T, Quote$adjustmentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    paymentPlans<T extends Quote$paymentPlansArgs<ExtArgs> = {}>(args?: Subset<T, Quote$paymentPlansArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    contractDraft<T extends Quote$contractDraftArgs<ExtArgs> = {}>(args?: Subset<T, Quote$contractDraftArgs<ExtArgs>>): Prisma__ContractDraftClient<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Quote model
   */
  interface QuoteFieldRefs {
    readonly id: FieldRef<"Quote", 'String'>
    readonly inquiryId: FieldRef<"Quote", 'String'>
    readonly status: FieldRef<"Quote", 'QuoteStatus'>
    readonly selectedServiceLegacyIds: FieldRef<"Quote", 'String'>
    readonly selectedOptionLegacyIds: FieldRef<"Quote", 'String'>
    readonly urgencyRuleCode: FieldRef<"Quote", 'String'>
    readonly consultRuleCode: FieldRef<"Quote", 'String'>
    readonly paymentRuleCode: FieldRef<"Quote", 'String'>
    readonly rangeMode: FieldRef<"Quote", 'Boolean'>
    readonly serviceBaseMin: FieldRef<"Quote", 'Int'>
    readonly serviceBaseMax: FieldRef<"Quote", 'Int'>
    readonly subtotalMin: FieldRef<"Quote", 'Int'>
    readonly subtotalMax: FieldRef<"Quote", 'Int'>
    readonly vatAmountMin: FieldRef<"Quote", 'Int'>
    readonly vatAmountMax: FieldRef<"Quote", 'Int'>
    readonly totalMin: FieldRef<"Quote", 'Int'>
    readonly totalMax: FieldRef<"Quote", 'Int'>
    readonly consultFee: FieldRef<"Quote", 'Int'>
    readonly successFeeRestricted: FieldRef<"Quote", 'Boolean'>
    readonly draftNotes: FieldRef<"Quote", 'String'>
    readonly calculationSummary: FieldRef<"Quote", 'String'>
    readonly createdAt: FieldRef<"Quote", 'DateTime'>
    readonly updatedAt: FieldRef<"Quote", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Quote findUnique
   */
  export type QuoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter, which Quote to fetch.
     */
    where: QuoteWhereUniqueInput
  }

  /**
   * Quote findUniqueOrThrow
   */
  export type QuoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter, which Quote to fetch.
     */
    where: QuoteWhereUniqueInput
  }

  /**
   * Quote findFirst
   */
  export type QuoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter, which Quote to fetch.
     */
    where?: QuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotes to fetch.
     */
    orderBy?: QuoteOrderByWithRelationInput | QuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Quotes.
     */
    cursor?: QuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Quotes.
     */
    distinct?: QuoteScalarFieldEnum | QuoteScalarFieldEnum[]
  }

  /**
   * Quote findFirstOrThrow
   */
  export type QuoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter, which Quote to fetch.
     */
    where?: QuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotes to fetch.
     */
    orderBy?: QuoteOrderByWithRelationInput | QuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Quotes.
     */
    cursor?: QuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Quotes.
     */
    distinct?: QuoteScalarFieldEnum | QuoteScalarFieldEnum[]
  }

  /**
   * Quote findMany
   */
  export type QuoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter, which Quotes to fetch.
     */
    where?: QuoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Quotes to fetch.
     */
    orderBy?: QuoteOrderByWithRelationInput | QuoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Quotes.
     */
    cursor?: QuoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Quotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Quotes.
     */
    skip?: number
    distinct?: QuoteScalarFieldEnum | QuoteScalarFieldEnum[]
  }

  /**
   * Quote create
   */
  export type QuoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * The data needed to create a Quote.
     */
    data: XOR<QuoteCreateInput, QuoteUncheckedCreateInput>
  }

  /**
   * Quote createMany
   */
  export type QuoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Quotes.
     */
    data: QuoteCreateManyInput | QuoteCreateManyInput[]
  }

  /**
   * Quote createManyAndReturn
   */
  export type QuoteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * The data used to create many Quotes.
     */
    data: QuoteCreateManyInput | QuoteCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Quote update
   */
  export type QuoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * The data needed to update a Quote.
     */
    data: XOR<QuoteUpdateInput, QuoteUncheckedUpdateInput>
    /**
     * Choose, which Quote to update.
     */
    where: QuoteWhereUniqueInput
  }

  /**
   * Quote updateMany
   */
  export type QuoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Quotes.
     */
    data: XOR<QuoteUpdateManyMutationInput, QuoteUncheckedUpdateManyInput>
    /**
     * Filter which Quotes to update
     */
    where?: QuoteWhereInput
    /**
     * Limit how many Quotes to update.
     */
    limit?: number
  }

  /**
   * Quote updateManyAndReturn
   */
  export type QuoteUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * The data used to update Quotes.
     */
    data: XOR<QuoteUpdateManyMutationInput, QuoteUncheckedUpdateManyInput>
    /**
     * Filter which Quotes to update
     */
    where?: QuoteWhereInput
    /**
     * Limit how many Quotes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Quote upsert
   */
  export type QuoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * The filter to search for the Quote to update in case it exists.
     */
    where: QuoteWhereUniqueInput
    /**
     * In case the Quote found by the `where` argument doesn't exist, create a new Quote with this data.
     */
    create: XOR<QuoteCreateInput, QuoteUncheckedCreateInput>
    /**
     * In case the Quote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuoteUpdateInput, QuoteUncheckedUpdateInput>
  }

  /**
   * Quote delete
   */
  export type QuoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
    /**
     * Filter which Quote to delete.
     */
    where: QuoteWhereUniqueInput
  }

  /**
   * Quote deleteMany
   */
  export type QuoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Quotes to delete
     */
    where?: QuoteWhereInput
    /**
     * Limit how many Quotes to delete.
     */
    limit?: number
  }

  /**
   * Quote.lineItems
   */
  export type Quote$lineItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    where?: QuoteLineItemWhereInput
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    cursor?: QuoteLineItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuoteLineItemScalarFieldEnum | QuoteLineItemScalarFieldEnum[]
  }

  /**
   * Quote.adjustments
   */
  export type Quote$adjustmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    where?: QuoteAdjustmentWhereInput
    orderBy?: QuoteAdjustmentOrderByWithRelationInput | QuoteAdjustmentOrderByWithRelationInput[]
    cursor?: QuoteAdjustmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: QuoteAdjustmentScalarFieldEnum | QuoteAdjustmentScalarFieldEnum[]
  }

  /**
   * Quote.paymentPlans
   */
  export type Quote$paymentPlansArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
    where?: PaymentPlanWhereInput
    orderBy?: PaymentPlanOrderByWithRelationInput | PaymentPlanOrderByWithRelationInput[]
    cursor?: PaymentPlanWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PaymentPlanScalarFieldEnum | PaymentPlanScalarFieldEnum[]
  }

  /**
   * Quote.contractDraft
   */
  export type Quote$contractDraftArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    where?: ContractDraftWhereInput
  }

  /**
   * Quote without action
   */
  export type QuoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Quote
     */
    select?: QuoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Quote
     */
    omit?: QuoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteInclude<ExtArgs> | null
  }


  /**
   * Model QuoteLineItem
   */

  export type AggregateQuoteLineItem = {
    _count: QuoteLineItemCountAggregateOutputType | null
    _avg: QuoteLineItemAvgAggregateOutputType | null
    _sum: QuoteLineItemSumAggregateOutputType | null
    _min: QuoteLineItemMinAggregateOutputType | null
    _max: QuoteLineItemMaxAggregateOutputType | null
  }

  export type QuoteLineItemAvgAggregateOutputType = {
    amountMin: number | null
    amountMax: number | null
    sortOrder: number | null
  }

  export type QuoteLineItemSumAggregateOutputType = {
    amountMin: number | null
    amountMax: number | null
    sortOrder: number | null
  }

  export type QuoteLineItemMinAggregateOutputType = {
    id: string | null
    quoteId: string | null
    serviceTypeId: string | null
    kind: $Enums.QuoteLineKind | null
    label: string | null
    description: string | null
    amountMin: number | null
    amountMax: number | null
    sortOrder: number | null
    isManual: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuoteLineItemMaxAggregateOutputType = {
    id: string | null
    quoteId: string | null
    serviceTypeId: string | null
    kind: $Enums.QuoteLineKind | null
    label: string | null
    description: string | null
    amountMin: number | null
    amountMax: number | null
    sortOrder: number | null
    isManual: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuoteLineItemCountAggregateOutputType = {
    id: number
    quoteId: number
    serviceTypeId: number
    kind: number
    label: number
    description: number
    amountMin: number
    amountMax: number
    sortOrder: number
    isManual: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type QuoteLineItemAvgAggregateInputType = {
    amountMin?: true
    amountMax?: true
    sortOrder?: true
  }

  export type QuoteLineItemSumAggregateInputType = {
    amountMin?: true
    amountMax?: true
    sortOrder?: true
  }

  export type QuoteLineItemMinAggregateInputType = {
    id?: true
    quoteId?: true
    serviceTypeId?: true
    kind?: true
    label?: true
    description?: true
    amountMin?: true
    amountMax?: true
    sortOrder?: true
    isManual?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuoteLineItemMaxAggregateInputType = {
    id?: true
    quoteId?: true
    serviceTypeId?: true
    kind?: true
    label?: true
    description?: true
    amountMin?: true
    amountMax?: true
    sortOrder?: true
    isManual?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuoteLineItemCountAggregateInputType = {
    id?: true
    quoteId?: true
    serviceTypeId?: true
    kind?: true
    label?: true
    description?: true
    amountMin?: true
    amountMax?: true
    sortOrder?: true
    isManual?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type QuoteLineItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuoteLineItem to aggregate.
     */
    where?: QuoteLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteLineItems to fetch.
     */
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuoteLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuoteLineItems
    **/
    _count?: true | QuoteLineItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuoteLineItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuoteLineItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuoteLineItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuoteLineItemMaxAggregateInputType
  }

  export type GetQuoteLineItemAggregateType<T extends QuoteLineItemAggregateArgs> = {
        [P in keyof T & keyof AggregateQuoteLineItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuoteLineItem[P]>
      : GetScalarType<T[P], AggregateQuoteLineItem[P]>
  }




  export type QuoteLineItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteLineItemWhereInput
    orderBy?: QuoteLineItemOrderByWithAggregationInput | QuoteLineItemOrderByWithAggregationInput[]
    by: QuoteLineItemScalarFieldEnum[] | QuoteLineItemScalarFieldEnum
    having?: QuoteLineItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuoteLineItemCountAggregateInputType | true
    _avg?: QuoteLineItemAvgAggregateInputType
    _sum?: QuoteLineItemSumAggregateInputType
    _min?: QuoteLineItemMinAggregateInputType
    _max?: QuoteLineItemMaxAggregateInputType
  }

  export type QuoteLineItemGroupByOutputType = {
    id: string
    quoteId: string
    serviceTypeId: string | null
    kind: $Enums.QuoteLineKind
    label: string
    description: string | null
    amountMin: number
    amountMax: number
    sortOrder: number
    isManual: boolean
    createdAt: Date
    updatedAt: Date
    _count: QuoteLineItemCountAggregateOutputType | null
    _avg: QuoteLineItemAvgAggregateOutputType | null
    _sum: QuoteLineItemSumAggregateOutputType | null
    _min: QuoteLineItemMinAggregateOutputType | null
    _max: QuoteLineItemMaxAggregateOutputType | null
  }

  type GetQuoteLineItemGroupByPayload<T extends QuoteLineItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuoteLineItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuoteLineItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuoteLineItemGroupByOutputType[P]>
            : GetScalarType<T[P], QuoteLineItemGroupByOutputType[P]>
        }
      >
    >


  export type QuoteLineItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    serviceTypeId?: boolean
    kind?: boolean
    label?: boolean
    description?: boolean
    amountMin?: boolean
    amountMax?: boolean
    sortOrder?: boolean
    isManual?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    serviceType?: boolean | QuoteLineItem$serviceTypeArgs<ExtArgs>
  }, ExtArgs["result"]["quoteLineItem"]>

  export type QuoteLineItemSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    serviceTypeId?: boolean
    kind?: boolean
    label?: boolean
    description?: boolean
    amountMin?: boolean
    amountMax?: boolean
    sortOrder?: boolean
    isManual?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    serviceType?: boolean | QuoteLineItem$serviceTypeArgs<ExtArgs>
  }, ExtArgs["result"]["quoteLineItem"]>

  export type QuoteLineItemSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    serviceTypeId?: boolean
    kind?: boolean
    label?: boolean
    description?: boolean
    amountMin?: boolean
    amountMax?: boolean
    sortOrder?: boolean
    isManual?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    serviceType?: boolean | QuoteLineItem$serviceTypeArgs<ExtArgs>
  }, ExtArgs["result"]["quoteLineItem"]>

  export type QuoteLineItemSelectScalar = {
    id?: boolean
    quoteId?: boolean
    serviceTypeId?: boolean
    kind?: boolean
    label?: boolean
    description?: boolean
    amountMin?: boolean
    amountMax?: boolean
    sortOrder?: boolean
    isManual?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type QuoteLineItemOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "quoteId" | "serviceTypeId" | "kind" | "label" | "description" | "amountMin" | "amountMax" | "sortOrder" | "isManual" | "createdAt" | "updatedAt", ExtArgs["result"]["quoteLineItem"]>
  export type QuoteLineItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    serviceType?: boolean | QuoteLineItem$serviceTypeArgs<ExtArgs>
  }
  export type QuoteLineItemIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    serviceType?: boolean | QuoteLineItem$serviceTypeArgs<ExtArgs>
  }
  export type QuoteLineItemIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    serviceType?: boolean | QuoteLineItem$serviceTypeArgs<ExtArgs>
  }

  export type $QuoteLineItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuoteLineItem"
    objects: {
      quote: Prisma.$QuotePayload<ExtArgs>
      serviceType: Prisma.$ServiceTypePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      quoteId: string
      serviceTypeId: string | null
      kind: $Enums.QuoteLineKind
      label: string
      description: string | null
      amountMin: number
      amountMax: number
      sortOrder: number
      isManual: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["quoteLineItem"]>
    composites: {}
  }

  type QuoteLineItemGetPayload<S extends boolean | null | undefined | QuoteLineItemDefaultArgs> = $Result.GetResult<Prisma.$QuoteLineItemPayload, S>

  type QuoteLineItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QuoteLineItemFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QuoteLineItemCountAggregateInputType | true
    }

  export interface QuoteLineItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuoteLineItem'], meta: { name: 'QuoteLineItem' } }
    /**
     * Find zero or one QuoteLineItem that matches the filter.
     * @param {QuoteLineItemFindUniqueArgs} args - Arguments to find a QuoteLineItem
     * @example
     * // Get one QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuoteLineItemFindUniqueArgs>(args: SelectSubset<T, QuoteLineItemFindUniqueArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one QuoteLineItem that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QuoteLineItemFindUniqueOrThrowArgs} args - Arguments to find a QuoteLineItem
     * @example
     * // Get one QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuoteLineItemFindUniqueOrThrowArgs>(args: SelectSubset<T, QuoteLineItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuoteLineItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemFindFirstArgs} args - Arguments to find a QuoteLineItem
     * @example
     * // Get one QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuoteLineItemFindFirstArgs>(args?: SelectSubset<T, QuoteLineItemFindFirstArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuoteLineItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemFindFirstOrThrowArgs} args - Arguments to find a QuoteLineItem
     * @example
     * // Get one QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuoteLineItemFindFirstOrThrowArgs>(args?: SelectSubset<T, QuoteLineItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more QuoteLineItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuoteLineItems
     * const quoteLineItems = await prisma.quoteLineItem.findMany()
     * 
     * // Get first 10 QuoteLineItems
     * const quoteLineItems = await prisma.quoteLineItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quoteLineItemWithIdOnly = await prisma.quoteLineItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuoteLineItemFindManyArgs>(args?: SelectSubset<T, QuoteLineItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a QuoteLineItem.
     * @param {QuoteLineItemCreateArgs} args - Arguments to create a QuoteLineItem.
     * @example
     * // Create one QuoteLineItem
     * const QuoteLineItem = await prisma.quoteLineItem.create({
     *   data: {
     *     // ... data to create a QuoteLineItem
     *   }
     * })
     * 
     */
    create<T extends QuoteLineItemCreateArgs>(args: SelectSubset<T, QuoteLineItemCreateArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many QuoteLineItems.
     * @param {QuoteLineItemCreateManyArgs} args - Arguments to create many QuoteLineItems.
     * @example
     * // Create many QuoteLineItems
     * const quoteLineItem = await prisma.quoteLineItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuoteLineItemCreateManyArgs>(args?: SelectSubset<T, QuoteLineItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuoteLineItems and returns the data saved in the database.
     * @param {QuoteLineItemCreateManyAndReturnArgs} args - Arguments to create many QuoteLineItems.
     * @example
     * // Create many QuoteLineItems
     * const quoteLineItem = await prisma.quoteLineItem.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuoteLineItems and only return the `id`
     * const quoteLineItemWithIdOnly = await prisma.quoteLineItem.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuoteLineItemCreateManyAndReturnArgs>(args?: SelectSubset<T, QuoteLineItemCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a QuoteLineItem.
     * @param {QuoteLineItemDeleteArgs} args - Arguments to delete one QuoteLineItem.
     * @example
     * // Delete one QuoteLineItem
     * const QuoteLineItem = await prisma.quoteLineItem.delete({
     *   where: {
     *     // ... filter to delete one QuoteLineItem
     *   }
     * })
     * 
     */
    delete<T extends QuoteLineItemDeleteArgs>(args: SelectSubset<T, QuoteLineItemDeleteArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one QuoteLineItem.
     * @param {QuoteLineItemUpdateArgs} args - Arguments to update one QuoteLineItem.
     * @example
     * // Update one QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuoteLineItemUpdateArgs>(args: SelectSubset<T, QuoteLineItemUpdateArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more QuoteLineItems.
     * @param {QuoteLineItemDeleteManyArgs} args - Arguments to filter QuoteLineItems to delete.
     * @example
     * // Delete a few QuoteLineItems
     * const { count } = await prisma.quoteLineItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuoteLineItemDeleteManyArgs>(args?: SelectSubset<T, QuoteLineItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuoteLineItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuoteLineItems
     * const quoteLineItem = await prisma.quoteLineItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuoteLineItemUpdateManyArgs>(args: SelectSubset<T, QuoteLineItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuoteLineItems and returns the data updated in the database.
     * @param {QuoteLineItemUpdateManyAndReturnArgs} args - Arguments to update many QuoteLineItems.
     * @example
     * // Update many QuoteLineItems
     * const quoteLineItem = await prisma.quoteLineItem.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more QuoteLineItems and only return the `id`
     * const quoteLineItemWithIdOnly = await prisma.quoteLineItem.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends QuoteLineItemUpdateManyAndReturnArgs>(args: SelectSubset<T, QuoteLineItemUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one QuoteLineItem.
     * @param {QuoteLineItemUpsertArgs} args - Arguments to update or create a QuoteLineItem.
     * @example
     * // Update or create a QuoteLineItem
     * const quoteLineItem = await prisma.quoteLineItem.upsert({
     *   create: {
     *     // ... data to create a QuoteLineItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuoteLineItem we want to update
     *   }
     * })
     */
    upsert<T extends QuoteLineItemUpsertArgs>(args: SelectSubset<T, QuoteLineItemUpsertArgs<ExtArgs>>): Prisma__QuoteLineItemClient<$Result.GetResult<Prisma.$QuoteLineItemPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of QuoteLineItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemCountArgs} args - Arguments to filter QuoteLineItems to count.
     * @example
     * // Count the number of QuoteLineItems
     * const count = await prisma.quoteLineItem.count({
     *   where: {
     *     // ... the filter for the QuoteLineItems we want to count
     *   }
     * })
    **/
    count<T extends QuoteLineItemCountArgs>(
      args?: Subset<T, QuoteLineItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuoteLineItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuoteLineItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuoteLineItemAggregateArgs>(args: Subset<T, QuoteLineItemAggregateArgs>): Prisma.PrismaPromise<GetQuoteLineItemAggregateType<T>>

    /**
     * Group by QuoteLineItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteLineItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuoteLineItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuoteLineItemGroupByArgs['orderBy'] }
        : { orderBy?: QuoteLineItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuoteLineItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuoteLineItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuoteLineItem model
   */
  readonly fields: QuoteLineItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuoteLineItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuoteLineItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quote<T extends QuoteDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuoteDefaultArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    serviceType<T extends QuoteLineItem$serviceTypeArgs<ExtArgs> = {}>(args?: Subset<T, QuoteLineItem$serviceTypeArgs<ExtArgs>>): Prisma__ServiceTypeClient<$Result.GetResult<Prisma.$ServiceTypePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the QuoteLineItem model
   */
  interface QuoteLineItemFieldRefs {
    readonly id: FieldRef<"QuoteLineItem", 'String'>
    readonly quoteId: FieldRef<"QuoteLineItem", 'String'>
    readonly serviceTypeId: FieldRef<"QuoteLineItem", 'String'>
    readonly kind: FieldRef<"QuoteLineItem", 'QuoteLineKind'>
    readonly label: FieldRef<"QuoteLineItem", 'String'>
    readonly description: FieldRef<"QuoteLineItem", 'String'>
    readonly amountMin: FieldRef<"QuoteLineItem", 'Int'>
    readonly amountMax: FieldRef<"QuoteLineItem", 'Int'>
    readonly sortOrder: FieldRef<"QuoteLineItem", 'Int'>
    readonly isManual: FieldRef<"QuoteLineItem", 'Boolean'>
    readonly createdAt: FieldRef<"QuoteLineItem", 'DateTime'>
    readonly updatedAt: FieldRef<"QuoteLineItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QuoteLineItem findUnique
   */
  export type QuoteLineItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter, which QuoteLineItem to fetch.
     */
    where: QuoteLineItemWhereUniqueInput
  }

  /**
   * QuoteLineItem findUniqueOrThrow
   */
  export type QuoteLineItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter, which QuoteLineItem to fetch.
     */
    where: QuoteLineItemWhereUniqueInput
  }

  /**
   * QuoteLineItem findFirst
   */
  export type QuoteLineItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter, which QuoteLineItem to fetch.
     */
    where?: QuoteLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteLineItems to fetch.
     */
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuoteLineItems.
     */
    cursor?: QuoteLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuoteLineItems.
     */
    distinct?: QuoteLineItemScalarFieldEnum | QuoteLineItemScalarFieldEnum[]
  }

  /**
   * QuoteLineItem findFirstOrThrow
   */
  export type QuoteLineItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter, which QuoteLineItem to fetch.
     */
    where?: QuoteLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteLineItems to fetch.
     */
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuoteLineItems.
     */
    cursor?: QuoteLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteLineItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuoteLineItems.
     */
    distinct?: QuoteLineItemScalarFieldEnum | QuoteLineItemScalarFieldEnum[]
  }

  /**
   * QuoteLineItem findMany
   */
  export type QuoteLineItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter, which QuoteLineItems to fetch.
     */
    where?: QuoteLineItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteLineItems to fetch.
     */
    orderBy?: QuoteLineItemOrderByWithRelationInput | QuoteLineItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuoteLineItems.
     */
    cursor?: QuoteLineItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteLineItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteLineItems.
     */
    skip?: number
    distinct?: QuoteLineItemScalarFieldEnum | QuoteLineItemScalarFieldEnum[]
  }

  /**
   * QuoteLineItem create
   */
  export type QuoteLineItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * The data needed to create a QuoteLineItem.
     */
    data: XOR<QuoteLineItemCreateInput, QuoteLineItemUncheckedCreateInput>
  }

  /**
   * QuoteLineItem createMany
   */
  export type QuoteLineItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuoteLineItems.
     */
    data: QuoteLineItemCreateManyInput | QuoteLineItemCreateManyInput[]
  }

  /**
   * QuoteLineItem createManyAndReturn
   */
  export type QuoteLineItemCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * The data used to create many QuoteLineItems.
     */
    data: QuoteLineItemCreateManyInput | QuoteLineItemCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuoteLineItem update
   */
  export type QuoteLineItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * The data needed to update a QuoteLineItem.
     */
    data: XOR<QuoteLineItemUpdateInput, QuoteLineItemUncheckedUpdateInput>
    /**
     * Choose, which QuoteLineItem to update.
     */
    where: QuoteLineItemWhereUniqueInput
  }

  /**
   * QuoteLineItem updateMany
   */
  export type QuoteLineItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuoteLineItems.
     */
    data: XOR<QuoteLineItemUpdateManyMutationInput, QuoteLineItemUncheckedUpdateManyInput>
    /**
     * Filter which QuoteLineItems to update
     */
    where?: QuoteLineItemWhereInput
    /**
     * Limit how many QuoteLineItems to update.
     */
    limit?: number
  }

  /**
   * QuoteLineItem updateManyAndReturn
   */
  export type QuoteLineItemUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * The data used to update QuoteLineItems.
     */
    data: XOR<QuoteLineItemUpdateManyMutationInput, QuoteLineItemUncheckedUpdateManyInput>
    /**
     * Filter which QuoteLineItems to update
     */
    where?: QuoteLineItemWhereInput
    /**
     * Limit how many QuoteLineItems to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuoteLineItem upsert
   */
  export type QuoteLineItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * The filter to search for the QuoteLineItem to update in case it exists.
     */
    where: QuoteLineItemWhereUniqueInput
    /**
     * In case the QuoteLineItem found by the `where` argument doesn't exist, create a new QuoteLineItem with this data.
     */
    create: XOR<QuoteLineItemCreateInput, QuoteLineItemUncheckedCreateInput>
    /**
     * In case the QuoteLineItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuoteLineItemUpdateInput, QuoteLineItemUncheckedUpdateInput>
  }

  /**
   * QuoteLineItem delete
   */
  export type QuoteLineItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
    /**
     * Filter which QuoteLineItem to delete.
     */
    where: QuoteLineItemWhereUniqueInput
  }

  /**
   * QuoteLineItem deleteMany
   */
  export type QuoteLineItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuoteLineItems to delete
     */
    where?: QuoteLineItemWhereInput
    /**
     * Limit how many QuoteLineItems to delete.
     */
    limit?: number
  }

  /**
   * QuoteLineItem.serviceType
   */
  export type QuoteLineItem$serviceTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceType
     */
    select?: ServiceTypeSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceType
     */
    omit?: ServiceTypeOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ServiceTypeInclude<ExtArgs> | null
    where?: ServiceTypeWhereInput
  }

  /**
   * QuoteLineItem without action
   */
  export type QuoteLineItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteLineItem
     */
    select?: QuoteLineItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteLineItem
     */
    omit?: QuoteLineItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteLineItemInclude<ExtArgs> | null
  }


  /**
   * Model QuoteAdjustment
   */

  export type AggregateQuoteAdjustment = {
    _count: QuoteAdjustmentCountAggregateOutputType | null
    _avg: QuoteAdjustmentAvgAggregateOutputType | null
    _sum: QuoteAdjustmentSumAggregateOutputType | null
    _min: QuoteAdjustmentMinAggregateOutputType | null
    _max: QuoteAdjustmentMaxAggregateOutputType | null
  }

  export type QuoteAdjustmentAvgAggregateOutputType = {
    flatAmount: number | null
    percentRate: number | null
    computedMin: number | null
    computedMax: number | null
    sortOrder: number | null
  }

  export type QuoteAdjustmentSumAggregateOutputType = {
    flatAmount: number | null
    percentRate: number | null
    computedMin: number | null
    computedMax: number | null
    sortOrder: number | null
  }

  export type QuoteAdjustmentMinAggregateOutputType = {
    id: string | null
    quoteId: string | null
    pricingOptionId: string | null
    label: string | null
    description: string | null
    optionType: $Enums.PricingOptionType | null
    flatAmount: number | null
    percentRate: number | null
    computedMin: number | null
    computedMax: number | null
    isVat: boolean | null
    sortOrder: number | null
    isManual: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuoteAdjustmentMaxAggregateOutputType = {
    id: string | null
    quoteId: string | null
    pricingOptionId: string | null
    label: string | null
    description: string | null
    optionType: $Enums.PricingOptionType | null
    flatAmount: number | null
    percentRate: number | null
    computedMin: number | null
    computedMax: number | null
    isVat: boolean | null
    sortOrder: number | null
    isManual: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type QuoteAdjustmentCountAggregateOutputType = {
    id: number
    quoteId: number
    pricingOptionId: number
    label: number
    description: number
    optionType: number
    flatAmount: number
    percentRate: number
    computedMin: number
    computedMax: number
    isVat: number
    sortOrder: number
    isManual: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type QuoteAdjustmentAvgAggregateInputType = {
    flatAmount?: true
    percentRate?: true
    computedMin?: true
    computedMax?: true
    sortOrder?: true
  }

  export type QuoteAdjustmentSumAggregateInputType = {
    flatAmount?: true
    percentRate?: true
    computedMin?: true
    computedMax?: true
    sortOrder?: true
  }

  export type QuoteAdjustmentMinAggregateInputType = {
    id?: true
    quoteId?: true
    pricingOptionId?: true
    label?: true
    description?: true
    optionType?: true
    flatAmount?: true
    percentRate?: true
    computedMin?: true
    computedMax?: true
    isVat?: true
    sortOrder?: true
    isManual?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuoteAdjustmentMaxAggregateInputType = {
    id?: true
    quoteId?: true
    pricingOptionId?: true
    label?: true
    description?: true
    optionType?: true
    flatAmount?: true
    percentRate?: true
    computedMin?: true
    computedMax?: true
    isVat?: true
    sortOrder?: true
    isManual?: true
    createdAt?: true
    updatedAt?: true
  }

  export type QuoteAdjustmentCountAggregateInputType = {
    id?: true
    quoteId?: true
    pricingOptionId?: true
    label?: true
    description?: true
    optionType?: true
    flatAmount?: true
    percentRate?: true
    computedMin?: true
    computedMax?: true
    isVat?: true
    sortOrder?: true
    isManual?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type QuoteAdjustmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuoteAdjustment to aggregate.
     */
    where?: QuoteAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteAdjustments to fetch.
     */
    orderBy?: QuoteAdjustmentOrderByWithRelationInput | QuoteAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: QuoteAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteAdjustments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned QuoteAdjustments
    **/
    _count?: true | QuoteAdjustmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: QuoteAdjustmentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: QuoteAdjustmentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: QuoteAdjustmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: QuoteAdjustmentMaxAggregateInputType
  }

  export type GetQuoteAdjustmentAggregateType<T extends QuoteAdjustmentAggregateArgs> = {
        [P in keyof T & keyof AggregateQuoteAdjustment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQuoteAdjustment[P]>
      : GetScalarType<T[P], AggregateQuoteAdjustment[P]>
  }




  export type QuoteAdjustmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QuoteAdjustmentWhereInput
    orderBy?: QuoteAdjustmentOrderByWithAggregationInput | QuoteAdjustmentOrderByWithAggregationInput[]
    by: QuoteAdjustmentScalarFieldEnum[] | QuoteAdjustmentScalarFieldEnum
    having?: QuoteAdjustmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: QuoteAdjustmentCountAggregateInputType | true
    _avg?: QuoteAdjustmentAvgAggregateInputType
    _sum?: QuoteAdjustmentSumAggregateInputType
    _min?: QuoteAdjustmentMinAggregateInputType
    _max?: QuoteAdjustmentMaxAggregateInputType
  }

  export type QuoteAdjustmentGroupByOutputType = {
    id: string
    quoteId: string
    pricingOptionId: string | null
    label: string
    description: string | null
    optionType: $Enums.PricingOptionType
    flatAmount: number | null
    percentRate: number | null
    computedMin: number
    computedMax: number
    isVat: boolean
    sortOrder: number
    isManual: boolean
    createdAt: Date
    updatedAt: Date
    _count: QuoteAdjustmentCountAggregateOutputType | null
    _avg: QuoteAdjustmentAvgAggregateOutputType | null
    _sum: QuoteAdjustmentSumAggregateOutputType | null
    _min: QuoteAdjustmentMinAggregateOutputType | null
    _max: QuoteAdjustmentMaxAggregateOutputType | null
  }

  type GetQuoteAdjustmentGroupByPayload<T extends QuoteAdjustmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QuoteAdjustmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof QuoteAdjustmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], QuoteAdjustmentGroupByOutputType[P]>
            : GetScalarType<T[P], QuoteAdjustmentGroupByOutputType[P]>
        }
      >
    >


  export type QuoteAdjustmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    pricingOptionId?: boolean
    label?: boolean
    description?: boolean
    optionType?: boolean
    flatAmount?: boolean
    percentRate?: boolean
    computedMin?: boolean
    computedMax?: boolean
    isVat?: boolean
    sortOrder?: boolean
    isManual?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    pricingOption?: boolean | QuoteAdjustment$pricingOptionArgs<ExtArgs>
  }, ExtArgs["result"]["quoteAdjustment"]>

  export type QuoteAdjustmentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    pricingOptionId?: boolean
    label?: boolean
    description?: boolean
    optionType?: boolean
    flatAmount?: boolean
    percentRate?: boolean
    computedMin?: boolean
    computedMax?: boolean
    isVat?: boolean
    sortOrder?: boolean
    isManual?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    pricingOption?: boolean | QuoteAdjustment$pricingOptionArgs<ExtArgs>
  }, ExtArgs["result"]["quoteAdjustment"]>

  export type QuoteAdjustmentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    pricingOptionId?: boolean
    label?: boolean
    description?: boolean
    optionType?: boolean
    flatAmount?: boolean
    percentRate?: boolean
    computedMin?: boolean
    computedMax?: boolean
    isVat?: boolean
    sortOrder?: boolean
    isManual?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    pricingOption?: boolean | QuoteAdjustment$pricingOptionArgs<ExtArgs>
  }, ExtArgs["result"]["quoteAdjustment"]>

  export type QuoteAdjustmentSelectScalar = {
    id?: boolean
    quoteId?: boolean
    pricingOptionId?: boolean
    label?: boolean
    description?: boolean
    optionType?: boolean
    flatAmount?: boolean
    percentRate?: boolean
    computedMin?: boolean
    computedMax?: boolean
    isVat?: boolean
    sortOrder?: boolean
    isManual?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type QuoteAdjustmentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "quoteId" | "pricingOptionId" | "label" | "description" | "optionType" | "flatAmount" | "percentRate" | "computedMin" | "computedMax" | "isVat" | "sortOrder" | "isManual" | "createdAt" | "updatedAt", ExtArgs["result"]["quoteAdjustment"]>
  export type QuoteAdjustmentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    pricingOption?: boolean | QuoteAdjustment$pricingOptionArgs<ExtArgs>
  }
  export type QuoteAdjustmentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    pricingOption?: boolean | QuoteAdjustment$pricingOptionArgs<ExtArgs>
  }
  export type QuoteAdjustmentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
    pricingOption?: boolean | QuoteAdjustment$pricingOptionArgs<ExtArgs>
  }

  export type $QuoteAdjustmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "QuoteAdjustment"
    objects: {
      quote: Prisma.$QuotePayload<ExtArgs>
      pricingOption: Prisma.$PricingOptionPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      quoteId: string
      pricingOptionId: string | null
      label: string
      description: string | null
      optionType: $Enums.PricingOptionType
      flatAmount: number | null
      percentRate: number | null
      computedMin: number
      computedMax: number
      isVat: boolean
      sortOrder: number
      isManual: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["quoteAdjustment"]>
    composites: {}
  }

  type QuoteAdjustmentGetPayload<S extends boolean | null | undefined | QuoteAdjustmentDefaultArgs> = $Result.GetResult<Prisma.$QuoteAdjustmentPayload, S>

  type QuoteAdjustmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<QuoteAdjustmentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: QuoteAdjustmentCountAggregateInputType | true
    }

  export interface QuoteAdjustmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QuoteAdjustment'], meta: { name: 'QuoteAdjustment' } }
    /**
     * Find zero or one QuoteAdjustment that matches the filter.
     * @param {QuoteAdjustmentFindUniqueArgs} args - Arguments to find a QuoteAdjustment
     * @example
     * // Get one QuoteAdjustment
     * const quoteAdjustment = await prisma.quoteAdjustment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QuoteAdjustmentFindUniqueArgs>(args: SelectSubset<T, QuoteAdjustmentFindUniqueArgs<ExtArgs>>): Prisma__QuoteAdjustmentClient<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one QuoteAdjustment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QuoteAdjustmentFindUniqueOrThrowArgs} args - Arguments to find a QuoteAdjustment
     * @example
     * // Get one QuoteAdjustment
     * const quoteAdjustment = await prisma.quoteAdjustment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QuoteAdjustmentFindUniqueOrThrowArgs>(args: SelectSubset<T, QuoteAdjustmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__QuoteAdjustmentClient<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuoteAdjustment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteAdjustmentFindFirstArgs} args - Arguments to find a QuoteAdjustment
     * @example
     * // Get one QuoteAdjustment
     * const quoteAdjustment = await prisma.quoteAdjustment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QuoteAdjustmentFindFirstArgs>(args?: SelectSubset<T, QuoteAdjustmentFindFirstArgs<ExtArgs>>): Prisma__QuoteAdjustmentClient<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first QuoteAdjustment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteAdjustmentFindFirstOrThrowArgs} args - Arguments to find a QuoteAdjustment
     * @example
     * // Get one QuoteAdjustment
     * const quoteAdjustment = await prisma.quoteAdjustment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QuoteAdjustmentFindFirstOrThrowArgs>(args?: SelectSubset<T, QuoteAdjustmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__QuoteAdjustmentClient<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more QuoteAdjustments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteAdjustmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QuoteAdjustments
     * const quoteAdjustments = await prisma.quoteAdjustment.findMany()
     * 
     * // Get first 10 QuoteAdjustments
     * const quoteAdjustments = await prisma.quoteAdjustment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const quoteAdjustmentWithIdOnly = await prisma.quoteAdjustment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends QuoteAdjustmentFindManyArgs>(args?: SelectSubset<T, QuoteAdjustmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a QuoteAdjustment.
     * @param {QuoteAdjustmentCreateArgs} args - Arguments to create a QuoteAdjustment.
     * @example
     * // Create one QuoteAdjustment
     * const QuoteAdjustment = await prisma.quoteAdjustment.create({
     *   data: {
     *     // ... data to create a QuoteAdjustment
     *   }
     * })
     * 
     */
    create<T extends QuoteAdjustmentCreateArgs>(args: SelectSubset<T, QuoteAdjustmentCreateArgs<ExtArgs>>): Prisma__QuoteAdjustmentClient<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many QuoteAdjustments.
     * @param {QuoteAdjustmentCreateManyArgs} args - Arguments to create many QuoteAdjustments.
     * @example
     * // Create many QuoteAdjustments
     * const quoteAdjustment = await prisma.quoteAdjustment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends QuoteAdjustmentCreateManyArgs>(args?: SelectSubset<T, QuoteAdjustmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many QuoteAdjustments and returns the data saved in the database.
     * @param {QuoteAdjustmentCreateManyAndReturnArgs} args - Arguments to create many QuoteAdjustments.
     * @example
     * // Create many QuoteAdjustments
     * const quoteAdjustment = await prisma.quoteAdjustment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many QuoteAdjustments and only return the `id`
     * const quoteAdjustmentWithIdOnly = await prisma.quoteAdjustment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends QuoteAdjustmentCreateManyAndReturnArgs>(args?: SelectSubset<T, QuoteAdjustmentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a QuoteAdjustment.
     * @param {QuoteAdjustmentDeleteArgs} args - Arguments to delete one QuoteAdjustment.
     * @example
     * // Delete one QuoteAdjustment
     * const QuoteAdjustment = await prisma.quoteAdjustment.delete({
     *   where: {
     *     // ... filter to delete one QuoteAdjustment
     *   }
     * })
     * 
     */
    delete<T extends QuoteAdjustmentDeleteArgs>(args: SelectSubset<T, QuoteAdjustmentDeleteArgs<ExtArgs>>): Prisma__QuoteAdjustmentClient<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one QuoteAdjustment.
     * @param {QuoteAdjustmentUpdateArgs} args - Arguments to update one QuoteAdjustment.
     * @example
     * // Update one QuoteAdjustment
     * const quoteAdjustment = await prisma.quoteAdjustment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends QuoteAdjustmentUpdateArgs>(args: SelectSubset<T, QuoteAdjustmentUpdateArgs<ExtArgs>>): Prisma__QuoteAdjustmentClient<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more QuoteAdjustments.
     * @param {QuoteAdjustmentDeleteManyArgs} args - Arguments to filter QuoteAdjustments to delete.
     * @example
     * // Delete a few QuoteAdjustments
     * const { count } = await prisma.quoteAdjustment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends QuoteAdjustmentDeleteManyArgs>(args?: SelectSubset<T, QuoteAdjustmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuoteAdjustments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteAdjustmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QuoteAdjustments
     * const quoteAdjustment = await prisma.quoteAdjustment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends QuoteAdjustmentUpdateManyArgs>(args: SelectSubset<T, QuoteAdjustmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more QuoteAdjustments and returns the data updated in the database.
     * @param {QuoteAdjustmentUpdateManyAndReturnArgs} args - Arguments to update many QuoteAdjustments.
     * @example
     * // Update many QuoteAdjustments
     * const quoteAdjustment = await prisma.quoteAdjustment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more QuoteAdjustments and only return the `id`
     * const quoteAdjustmentWithIdOnly = await prisma.quoteAdjustment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends QuoteAdjustmentUpdateManyAndReturnArgs>(args: SelectSubset<T, QuoteAdjustmentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one QuoteAdjustment.
     * @param {QuoteAdjustmentUpsertArgs} args - Arguments to update or create a QuoteAdjustment.
     * @example
     * // Update or create a QuoteAdjustment
     * const quoteAdjustment = await prisma.quoteAdjustment.upsert({
     *   create: {
     *     // ... data to create a QuoteAdjustment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QuoteAdjustment we want to update
     *   }
     * })
     */
    upsert<T extends QuoteAdjustmentUpsertArgs>(args: SelectSubset<T, QuoteAdjustmentUpsertArgs<ExtArgs>>): Prisma__QuoteAdjustmentClient<$Result.GetResult<Prisma.$QuoteAdjustmentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of QuoteAdjustments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteAdjustmentCountArgs} args - Arguments to filter QuoteAdjustments to count.
     * @example
     * // Count the number of QuoteAdjustments
     * const count = await prisma.quoteAdjustment.count({
     *   where: {
     *     // ... the filter for the QuoteAdjustments we want to count
     *   }
     * })
    **/
    count<T extends QuoteAdjustmentCountArgs>(
      args?: Subset<T, QuoteAdjustmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QuoteAdjustmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a QuoteAdjustment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteAdjustmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends QuoteAdjustmentAggregateArgs>(args: Subset<T, QuoteAdjustmentAggregateArgs>): Prisma.PrismaPromise<GetQuoteAdjustmentAggregateType<T>>

    /**
     * Group by QuoteAdjustment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QuoteAdjustmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends QuoteAdjustmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QuoteAdjustmentGroupByArgs['orderBy'] }
        : { orderBy?: QuoteAdjustmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, QuoteAdjustmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetQuoteAdjustmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the QuoteAdjustment model
   */
  readonly fields: QuoteAdjustmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QuoteAdjustment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QuoteAdjustmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quote<T extends QuoteDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuoteDefaultArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    pricingOption<T extends QuoteAdjustment$pricingOptionArgs<ExtArgs> = {}>(args?: Subset<T, QuoteAdjustment$pricingOptionArgs<ExtArgs>>): Prisma__PricingOptionClient<$Result.GetResult<Prisma.$PricingOptionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the QuoteAdjustment model
   */
  interface QuoteAdjustmentFieldRefs {
    readonly id: FieldRef<"QuoteAdjustment", 'String'>
    readonly quoteId: FieldRef<"QuoteAdjustment", 'String'>
    readonly pricingOptionId: FieldRef<"QuoteAdjustment", 'String'>
    readonly label: FieldRef<"QuoteAdjustment", 'String'>
    readonly description: FieldRef<"QuoteAdjustment", 'String'>
    readonly optionType: FieldRef<"QuoteAdjustment", 'PricingOptionType'>
    readonly flatAmount: FieldRef<"QuoteAdjustment", 'Int'>
    readonly percentRate: FieldRef<"QuoteAdjustment", 'Int'>
    readonly computedMin: FieldRef<"QuoteAdjustment", 'Int'>
    readonly computedMax: FieldRef<"QuoteAdjustment", 'Int'>
    readonly isVat: FieldRef<"QuoteAdjustment", 'Boolean'>
    readonly sortOrder: FieldRef<"QuoteAdjustment", 'Int'>
    readonly isManual: FieldRef<"QuoteAdjustment", 'Boolean'>
    readonly createdAt: FieldRef<"QuoteAdjustment", 'DateTime'>
    readonly updatedAt: FieldRef<"QuoteAdjustment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * QuoteAdjustment findUnique
   */
  export type QuoteAdjustmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    /**
     * Filter, which QuoteAdjustment to fetch.
     */
    where: QuoteAdjustmentWhereUniqueInput
  }

  /**
   * QuoteAdjustment findUniqueOrThrow
   */
  export type QuoteAdjustmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    /**
     * Filter, which QuoteAdjustment to fetch.
     */
    where: QuoteAdjustmentWhereUniqueInput
  }

  /**
   * QuoteAdjustment findFirst
   */
  export type QuoteAdjustmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    /**
     * Filter, which QuoteAdjustment to fetch.
     */
    where?: QuoteAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteAdjustments to fetch.
     */
    orderBy?: QuoteAdjustmentOrderByWithRelationInput | QuoteAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuoteAdjustments.
     */
    cursor?: QuoteAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteAdjustments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuoteAdjustments.
     */
    distinct?: QuoteAdjustmentScalarFieldEnum | QuoteAdjustmentScalarFieldEnum[]
  }

  /**
   * QuoteAdjustment findFirstOrThrow
   */
  export type QuoteAdjustmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    /**
     * Filter, which QuoteAdjustment to fetch.
     */
    where?: QuoteAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteAdjustments to fetch.
     */
    orderBy?: QuoteAdjustmentOrderByWithRelationInput | QuoteAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for QuoteAdjustments.
     */
    cursor?: QuoteAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteAdjustments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of QuoteAdjustments.
     */
    distinct?: QuoteAdjustmentScalarFieldEnum | QuoteAdjustmentScalarFieldEnum[]
  }

  /**
   * QuoteAdjustment findMany
   */
  export type QuoteAdjustmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    /**
     * Filter, which QuoteAdjustments to fetch.
     */
    where?: QuoteAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of QuoteAdjustments to fetch.
     */
    orderBy?: QuoteAdjustmentOrderByWithRelationInput | QuoteAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing QuoteAdjustments.
     */
    cursor?: QuoteAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` QuoteAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` QuoteAdjustments.
     */
    skip?: number
    distinct?: QuoteAdjustmentScalarFieldEnum | QuoteAdjustmentScalarFieldEnum[]
  }

  /**
   * QuoteAdjustment create
   */
  export type QuoteAdjustmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    /**
     * The data needed to create a QuoteAdjustment.
     */
    data: XOR<QuoteAdjustmentCreateInput, QuoteAdjustmentUncheckedCreateInput>
  }

  /**
   * QuoteAdjustment createMany
   */
  export type QuoteAdjustmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QuoteAdjustments.
     */
    data: QuoteAdjustmentCreateManyInput | QuoteAdjustmentCreateManyInput[]
  }

  /**
   * QuoteAdjustment createManyAndReturn
   */
  export type QuoteAdjustmentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * The data used to create many QuoteAdjustments.
     */
    data: QuoteAdjustmentCreateManyInput | QuoteAdjustmentCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuoteAdjustment update
   */
  export type QuoteAdjustmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    /**
     * The data needed to update a QuoteAdjustment.
     */
    data: XOR<QuoteAdjustmentUpdateInput, QuoteAdjustmentUncheckedUpdateInput>
    /**
     * Choose, which QuoteAdjustment to update.
     */
    where: QuoteAdjustmentWhereUniqueInput
  }

  /**
   * QuoteAdjustment updateMany
   */
  export type QuoteAdjustmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QuoteAdjustments.
     */
    data: XOR<QuoteAdjustmentUpdateManyMutationInput, QuoteAdjustmentUncheckedUpdateManyInput>
    /**
     * Filter which QuoteAdjustments to update
     */
    where?: QuoteAdjustmentWhereInput
    /**
     * Limit how many QuoteAdjustments to update.
     */
    limit?: number
  }

  /**
   * QuoteAdjustment updateManyAndReturn
   */
  export type QuoteAdjustmentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * The data used to update QuoteAdjustments.
     */
    data: XOR<QuoteAdjustmentUpdateManyMutationInput, QuoteAdjustmentUncheckedUpdateManyInput>
    /**
     * Filter which QuoteAdjustments to update
     */
    where?: QuoteAdjustmentWhereInput
    /**
     * Limit how many QuoteAdjustments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * QuoteAdjustment upsert
   */
  export type QuoteAdjustmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    /**
     * The filter to search for the QuoteAdjustment to update in case it exists.
     */
    where: QuoteAdjustmentWhereUniqueInput
    /**
     * In case the QuoteAdjustment found by the `where` argument doesn't exist, create a new QuoteAdjustment with this data.
     */
    create: XOR<QuoteAdjustmentCreateInput, QuoteAdjustmentUncheckedCreateInput>
    /**
     * In case the QuoteAdjustment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QuoteAdjustmentUpdateInput, QuoteAdjustmentUncheckedUpdateInput>
  }

  /**
   * QuoteAdjustment delete
   */
  export type QuoteAdjustmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
    /**
     * Filter which QuoteAdjustment to delete.
     */
    where: QuoteAdjustmentWhereUniqueInput
  }

  /**
   * QuoteAdjustment deleteMany
   */
  export type QuoteAdjustmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QuoteAdjustments to delete
     */
    where?: QuoteAdjustmentWhereInput
    /**
     * Limit how many QuoteAdjustments to delete.
     */
    limit?: number
  }

  /**
   * QuoteAdjustment.pricingOption
   */
  export type QuoteAdjustment$pricingOptionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingOption
     */
    select?: PricingOptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingOption
     */
    omit?: PricingOptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PricingOptionInclude<ExtArgs> | null
    where?: PricingOptionWhereInput
  }

  /**
   * QuoteAdjustment without action
   */
  export type QuoteAdjustmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QuoteAdjustment
     */
    select?: QuoteAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the QuoteAdjustment
     */
    omit?: QuoteAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QuoteAdjustmentInclude<ExtArgs> | null
  }


  /**
   * Model PaymentPlan
   */

  export type AggregatePaymentPlan = {
    _count: PaymentPlanCountAggregateOutputType | null
    _avg: PaymentPlanAvgAggregateOutputType | null
    _sum: PaymentPlanSumAggregateOutputType | null
    _min: PaymentPlanMinAggregateOutputType | null
    _max: PaymentPlanMaxAggregateOutputType | null
  }

  export type PaymentPlanAvgAggregateOutputType = {
    percentage: number | null
    amountMin: number | null
    amountMax: number | null
    sortOrder: number | null
  }

  export type PaymentPlanSumAggregateOutputType = {
    percentage: number | null
    amountMin: number | null
    amountMax: number | null
    sortOrder: number | null
  }

  export type PaymentPlanMinAggregateOutputType = {
    id: string | null
    quoteId: string | null
    stageKind: $Enums.PaymentStageKind | null
    percentage: number | null
    dueText: string | null
    amountMin: number | null
    amountMax: number | null
    sortOrder: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentPlanMaxAggregateOutputType = {
    id: string | null
    quoteId: string | null
    stageKind: $Enums.PaymentStageKind | null
    percentage: number | null
    dueText: string | null
    amountMin: number | null
    amountMax: number | null
    sortOrder: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentPlanCountAggregateOutputType = {
    id: number
    quoteId: number
    stageKind: number
    percentage: number
    dueText: number
    amountMin: number
    amountMax: number
    sortOrder: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PaymentPlanAvgAggregateInputType = {
    percentage?: true
    amountMin?: true
    amountMax?: true
    sortOrder?: true
  }

  export type PaymentPlanSumAggregateInputType = {
    percentage?: true
    amountMin?: true
    amountMax?: true
    sortOrder?: true
  }

  export type PaymentPlanMinAggregateInputType = {
    id?: true
    quoteId?: true
    stageKind?: true
    percentage?: true
    dueText?: true
    amountMin?: true
    amountMax?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentPlanMaxAggregateInputType = {
    id?: true
    quoteId?: true
    stageKind?: true
    percentage?: true
    dueText?: true
    amountMin?: true
    amountMax?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentPlanCountAggregateInputType = {
    id?: true
    quoteId?: true
    stageKind?: true
    percentage?: true
    dueText?: true
    amountMin?: true
    amountMax?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PaymentPlanAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PaymentPlan to aggregate.
     */
    where?: PaymentPlanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentPlans to fetch.
     */
    orderBy?: PaymentPlanOrderByWithRelationInput | PaymentPlanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PaymentPlanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentPlans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentPlans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PaymentPlans
    **/
    _count?: true | PaymentPlanCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PaymentPlanAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PaymentPlanSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PaymentPlanMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PaymentPlanMaxAggregateInputType
  }

  export type GetPaymentPlanAggregateType<T extends PaymentPlanAggregateArgs> = {
        [P in keyof T & keyof AggregatePaymentPlan]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePaymentPlan[P]>
      : GetScalarType<T[P], AggregatePaymentPlan[P]>
  }




  export type PaymentPlanGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentPlanWhereInput
    orderBy?: PaymentPlanOrderByWithAggregationInput | PaymentPlanOrderByWithAggregationInput[]
    by: PaymentPlanScalarFieldEnum[] | PaymentPlanScalarFieldEnum
    having?: PaymentPlanScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PaymentPlanCountAggregateInputType | true
    _avg?: PaymentPlanAvgAggregateInputType
    _sum?: PaymentPlanSumAggregateInputType
    _min?: PaymentPlanMinAggregateInputType
    _max?: PaymentPlanMaxAggregateInputType
  }

  export type PaymentPlanGroupByOutputType = {
    id: string
    quoteId: string
    stageKind: $Enums.PaymentStageKind
    percentage: number
    dueText: string
    amountMin: number
    amountMax: number
    sortOrder: number
    createdAt: Date
    updatedAt: Date
    _count: PaymentPlanCountAggregateOutputType | null
    _avg: PaymentPlanAvgAggregateOutputType | null
    _sum: PaymentPlanSumAggregateOutputType | null
    _min: PaymentPlanMinAggregateOutputType | null
    _max: PaymentPlanMaxAggregateOutputType | null
  }

  type GetPaymentPlanGroupByPayload<T extends PaymentPlanGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PaymentPlanGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PaymentPlanGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PaymentPlanGroupByOutputType[P]>
            : GetScalarType<T[P], PaymentPlanGroupByOutputType[P]>
        }
      >
    >


  export type PaymentPlanSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    stageKind?: boolean
    percentage?: boolean
    dueText?: boolean
    amountMin?: boolean
    amountMax?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["paymentPlan"]>

  export type PaymentPlanSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    stageKind?: boolean
    percentage?: boolean
    dueText?: boolean
    amountMin?: boolean
    amountMax?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["paymentPlan"]>

  export type PaymentPlanSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    quoteId?: boolean
    stageKind?: boolean
    percentage?: boolean
    dueText?: boolean
    amountMin?: boolean
    amountMax?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["paymentPlan"]>

  export type PaymentPlanSelectScalar = {
    id?: boolean
    quoteId?: boolean
    stageKind?: boolean
    percentage?: boolean
    dueText?: boolean
    amountMin?: boolean
    amountMax?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PaymentPlanOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "quoteId" | "stageKind" | "percentage" | "dueText" | "amountMin" | "amountMax" | "sortOrder" | "createdAt" | "updatedAt", ExtArgs["result"]["paymentPlan"]>
  export type PaymentPlanInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }
  export type PaymentPlanIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }
  export type PaymentPlanIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }

  export type $PaymentPlanPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PaymentPlan"
    objects: {
      quote: Prisma.$QuotePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      quoteId: string
      stageKind: $Enums.PaymentStageKind
      percentage: number
      dueText: string
      amountMin: number
      amountMax: number
      sortOrder: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["paymentPlan"]>
    composites: {}
  }

  type PaymentPlanGetPayload<S extends boolean | null | undefined | PaymentPlanDefaultArgs> = $Result.GetResult<Prisma.$PaymentPlanPayload, S>

  type PaymentPlanCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PaymentPlanFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PaymentPlanCountAggregateInputType | true
    }

  export interface PaymentPlanDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PaymentPlan'], meta: { name: 'PaymentPlan' } }
    /**
     * Find zero or one PaymentPlan that matches the filter.
     * @param {PaymentPlanFindUniqueArgs} args - Arguments to find a PaymentPlan
     * @example
     * // Get one PaymentPlan
     * const paymentPlan = await prisma.paymentPlan.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PaymentPlanFindUniqueArgs>(args: SelectSubset<T, PaymentPlanFindUniqueArgs<ExtArgs>>): Prisma__PaymentPlanClient<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PaymentPlan that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PaymentPlanFindUniqueOrThrowArgs} args - Arguments to find a PaymentPlan
     * @example
     * // Get one PaymentPlan
     * const paymentPlan = await prisma.paymentPlan.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PaymentPlanFindUniqueOrThrowArgs>(args: SelectSubset<T, PaymentPlanFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PaymentPlanClient<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PaymentPlan that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentPlanFindFirstArgs} args - Arguments to find a PaymentPlan
     * @example
     * // Get one PaymentPlan
     * const paymentPlan = await prisma.paymentPlan.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PaymentPlanFindFirstArgs>(args?: SelectSubset<T, PaymentPlanFindFirstArgs<ExtArgs>>): Prisma__PaymentPlanClient<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PaymentPlan that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentPlanFindFirstOrThrowArgs} args - Arguments to find a PaymentPlan
     * @example
     * // Get one PaymentPlan
     * const paymentPlan = await prisma.paymentPlan.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PaymentPlanFindFirstOrThrowArgs>(args?: SelectSubset<T, PaymentPlanFindFirstOrThrowArgs<ExtArgs>>): Prisma__PaymentPlanClient<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PaymentPlans that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentPlanFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PaymentPlans
     * const paymentPlans = await prisma.paymentPlan.findMany()
     * 
     * // Get first 10 PaymentPlans
     * const paymentPlans = await prisma.paymentPlan.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const paymentPlanWithIdOnly = await prisma.paymentPlan.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PaymentPlanFindManyArgs>(args?: SelectSubset<T, PaymentPlanFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PaymentPlan.
     * @param {PaymentPlanCreateArgs} args - Arguments to create a PaymentPlan.
     * @example
     * // Create one PaymentPlan
     * const PaymentPlan = await prisma.paymentPlan.create({
     *   data: {
     *     // ... data to create a PaymentPlan
     *   }
     * })
     * 
     */
    create<T extends PaymentPlanCreateArgs>(args: SelectSubset<T, PaymentPlanCreateArgs<ExtArgs>>): Prisma__PaymentPlanClient<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PaymentPlans.
     * @param {PaymentPlanCreateManyArgs} args - Arguments to create many PaymentPlans.
     * @example
     * // Create many PaymentPlans
     * const paymentPlan = await prisma.paymentPlan.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PaymentPlanCreateManyArgs>(args?: SelectSubset<T, PaymentPlanCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PaymentPlans and returns the data saved in the database.
     * @param {PaymentPlanCreateManyAndReturnArgs} args - Arguments to create many PaymentPlans.
     * @example
     * // Create many PaymentPlans
     * const paymentPlan = await prisma.paymentPlan.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PaymentPlans and only return the `id`
     * const paymentPlanWithIdOnly = await prisma.paymentPlan.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PaymentPlanCreateManyAndReturnArgs>(args?: SelectSubset<T, PaymentPlanCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PaymentPlan.
     * @param {PaymentPlanDeleteArgs} args - Arguments to delete one PaymentPlan.
     * @example
     * // Delete one PaymentPlan
     * const PaymentPlan = await prisma.paymentPlan.delete({
     *   where: {
     *     // ... filter to delete one PaymentPlan
     *   }
     * })
     * 
     */
    delete<T extends PaymentPlanDeleteArgs>(args: SelectSubset<T, PaymentPlanDeleteArgs<ExtArgs>>): Prisma__PaymentPlanClient<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PaymentPlan.
     * @param {PaymentPlanUpdateArgs} args - Arguments to update one PaymentPlan.
     * @example
     * // Update one PaymentPlan
     * const paymentPlan = await prisma.paymentPlan.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PaymentPlanUpdateArgs>(args: SelectSubset<T, PaymentPlanUpdateArgs<ExtArgs>>): Prisma__PaymentPlanClient<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PaymentPlans.
     * @param {PaymentPlanDeleteManyArgs} args - Arguments to filter PaymentPlans to delete.
     * @example
     * // Delete a few PaymentPlans
     * const { count } = await prisma.paymentPlan.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PaymentPlanDeleteManyArgs>(args?: SelectSubset<T, PaymentPlanDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PaymentPlans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentPlanUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PaymentPlans
     * const paymentPlan = await prisma.paymentPlan.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PaymentPlanUpdateManyArgs>(args: SelectSubset<T, PaymentPlanUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PaymentPlans and returns the data updated in the database.
     * @param {PaymentPlanUpdateManyAndReturnArgs} args - Arguments to update many PaymentPlans.
     * @example
     * // Update many PaymentPlans
     * const paymentPlan = await prisma.paymentPlan.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PaymentPlans and only return the `id`
     * const paymentPlanWithIdOnly = await prisma.paymentPlan.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PaymentPlanUpdateManyAndReturnArgs>(args: SelectSubset<T, PaymentPlanUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PaymentPlan.
     * @param {PaymentPlanUpsertArgs} args - Arguments to update or create a PaymentPlan.
     * @example
     * // Update or create a PaymentPlan
     * const paymentPlan = await prisma.paymentPlan.upsert({
     *   create: {
     *     // ... data to create a PaymentPlan
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PaymentPlan we want to update
     *   }
     * })
     */
    upsert<T extends PaymentPlanUpsertArgs>(args: SelectSubset<T, PaymentPlanUpsertArgs<ExtArgs>>): Prisma__PaymentPlanClient<$Result.GetResult<Prisma.$PaymentPlanPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PaymentPlans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentPlanCountArgs} args - Arguments to filter PaymentPlans to count.
     * @example
     * // Count the number of PaymentPlans
     * const count = await prisma.paymentPlan.count({
     *   where: {
     *     // ... the filter for the PaymentPlans we want to count
     *   }
     * })
    **/
    count<T extends PaymentPlanCountArgs>(
      args?: Subset<T, PaymentPlanCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PaymentPlanCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PaymentPlan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentPlanAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PaymentPlanAggregateArgs>(args: Subset<T, PaymentPlanAggregateArgs>): Prisma.PrismaPromise<GetPaymentPlanAggregateType<T>>

    /**
     * Group by PaymentPlan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentPlanGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PaymentPlanGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PaymentPlanGroupByArgs['orderBy'] }
        : { orderBy?: PaymentPlanGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PaymentPlanGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPaymentPlanGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PaymentPlan model
   */
  readonly fields: PaymentPlanFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PaymentPlan.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PaymentPlanClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    quote<T extends QuoteDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuoteDefaultArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PaymentPlan model
   */
  interface PaymentPlanFieldRefs {
    readonly id: FieldRef<"PaymentPlan", 'String'>
    readonly quoteId: FieldRef<"PaymentPlan", 'String'>
    readonly stageKind: FieldRef<"PaymentPlan", 'PaymentStageKind'>
    readonly percentage: FieldRef<"PaymentPlan", 'Int'>
    readonly dueText: FieldRef<"PaymentPlan", 'String'>
    readonly amountMin: FieldRef<"PaymentPlan", 'Int'>
    readonly amountMax: FieldRef<"PaymentPlan", 'Int'>
    readonly sortOrder: FieldRef<"PaymentPlan", 'Int'>
    readonly createdAt: FieldRef<"PaymentPlan", 'DateTime'>
    readonly updatedAt: FieldRef<"PaymentPlan", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PaymentPlan findUnique
   */
  export type PaymentPlanFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
    /**
     * Filter, which PaymentPlan to fetch.
     */
    where: PaymentPlanWhereUniqueInput
  }

  /**
   * PaymentPlan findUniqueOrThrow
   */
  export type PaymentPlanFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
    /**
     * Filter, which PaymentPlan to fetch.
     */
    where: PaymentPlanWhereUniqueInput
  }

  /**
   * PaymentPlan findFirst
   */
  export type PaymentPlanFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
    /**
     * Filter, which PaymentPlan to fetch.
     */
    where?: PaymentPlanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentPlans to fetch.
     */
    orderBy?: PaymentPlanOrderByWithRelationInput | PaymentPlanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PaymentPlans.
     */
    cursor?: PaymentPlanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentPlans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentPlans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PaymentPlans.
     */
    distinct?: PaymentPlanScalarFieldEnum | PaymentPlanScalarFieldEnum[]
  }

  /**
   * PaymentPlan findFirstOrThrow
   */
  export type PaymentPlanFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
    /**
     * Filter, which PaymentPlan to fetch.
     */
    where?: PaymentPlanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentPlans to fetch.
     */
    orderBy?: PaymentPlanOrderByWithRelationInput | PaymentPlanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PaymentPlans.
     */
    cursor?: PaymentPlanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentPlans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentPlans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PaymentPlans.
     */
    distinct?: PaymentPlanScalarFieldEnum | PaymentPlanScalarFieldEnum[]
  }

  /**
   * PaymentPlan findMany
   */
  export type PaymentPlanFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
    /**
     * Filter, which PaymentPlans to fetch.
     */
    where?: PaymentPlanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentPlans to fetch.
     */
    orderBy?: PaymentPlanOrderByWithRelationInput | PaymentPlanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PaymentPlans.
     */
    cursor?: PaymentPlanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentPlans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentPlans.
     */
    skip?: number
    distinct?: PaymentPlanScalarFieldEnum | PaymentPlanScalarFieldEnum[]
  }

  /**
   * PaymentPlan create
   */
  export type PaymentPlanCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
    /**
     * The data needed to create a PaymentPlan.
     */
    data: XOR<PaymentPlanCreateInput, PaymentPlanUncheckedCreateInput>
  }

  /**
   * PaymentPlan createMany
   */
  export type PaymentPlanCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PaymentPlans.
     */
    data: PaymentPlanCreateManyInput | PaymentPlanCreateManyInput[]
  }

  /**
   * PaymentPlan createManyAndReturn
   */
  export type PaymentPlanCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * The data used to create many PaymentPlans.
     */
    data: PaymentPlanCreateManyInput | PaymentPlanCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PaymentPlan update
   */
  export type PaymentPlanUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
    /**
     * The data needed to update a PaymentPlan.
     */
    data: XOR<PaymentPlanUpdateInput, PaymentPlanUncheckedUpdateInput>
    /**
     * Choose, which PaymentPlan to update.
     */
    where: PaymentPlanWhereUniqueInput
  }

  /**
   * PaymentPlan updateMany
   */
  export type PaymentPlanUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PaymentPlans.
     */
    data: XOR<PaymentPlanUpdateManyMutationInput, PaymentPlanUncheckedUpdateManyInput>
    /**
     * Filter which PaymentPlans to update
     */
    where?: PaymentPlanWhereInput
    /**
     * Limit how many PaymentPlans to update.
     */
    limit?: number
  }

  /**
   * PaymentPlan updateManyAndReturn
   */
  export type PaymentPlanUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * The data used to update PaymentPlans.
     */
    data: XOR<PaymentPlanUpdateManyMutationInput, PaymentPlanUncheckedUpdateManyInput>
    /**
     * Filter which PaymentPlans to update
     */
    where?: PaymentPlanWhereInput
    /**
     * Limit how many PaymentPlans to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PaymentPlan upsert
   */
  export type PaymentPlanUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
    /**
     * The filter to search for the PaymentPlan to update in case it exists.
     */
    where: PaymentPlanWhereUniqueInput
    /**
     * In case the PaymentPlan found by the `where` argument doesn't exist, create a new PaymentPlan with this data.
     */
    create: XOR<PaymentPlanCreateInput, PaymentPlanUncheckedCreateInput>
    /**
     * In case the PaymentPlan was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PaymentPlanUpdateInput, PaymentPlanUncheckedUpdateInput>
  }

  /**
   * PaymentPlan delete
   */
  export type PaymentPlanDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
    /**
     * Filter which PaymentPlan to delete.
     */
    where: PaymentPlanWhereUniqueInput
  }

  /**
   * PaymentPlan deleteMany
   */
  export type PaymentPlanDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PaymentPlans to delete
     */
    where?: PaymentPlanWhereInput
    /**
     * Limit how many PaymentPlans to delete.
     */
    limit?: number
  }

  /**
   * PaymentPlan without action
   */
  export type PaymentPlanDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentPlan
     */
    select?: PaymentPlanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentPlan
     */
    omit?: PaymentPlanOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PaymentPlanInclude<ExtArgs> | null
  }


  /**
   * Model ContractDraft
   */

  export type AggregateContractDraft = {
    _count: ContractDraftCountAggregateOutputType | null
    _min: ContractDraftMinAggregateOutputType | null
    _max: ContractDraftMaxAggregateOutputType | null
  }

  export type ContractDraftMinAggregateOutputType = {
    id: string | null
    inquiryId: string | null
    quoteId: string | null
    status: $Enums.ContractDraftStatus | null
    title: string | null
    bodyText: string | null
    scopeText: string | null
    paymentSummary: string | null
    successFeeRestricted: boolean | null
    specialTerms: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContractDraftMaxAggregateOutputType = {
    id: string | null
    inquiryId: string | null
    quoteId: string | null
    status: $Enums.ContractDraftStatus | null
    title: string | null
    bodyText: string | null
    scopeText: string | null
    paymentSummary: string | null
    successFeeRestricted: boolean | null
    specialTerms: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ContractDraftCountAggregateOutputType = {
    id: number
    inquiryId: number
    quoteId: number
    status: number
    title: number
    bodyText: number
    scopeText: number
    paymentSummary: number
    successFeeRestricted: number
    specialTerms: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ContractDraftMinAggregateInputType = {
    id?: true
    inquiryId?: true
    quoteId?: true
    status?: true
    title?: true
    bodyText?: true
    scopeText?: true
    paymentSummary?: true
    successFeeRestricted?: true
    specialTerms?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContractDraftMaxAggregateInputType = {
    id?: true
    inquiryId?: true
    quoteId?: true
    status?: true
    title?: true
    bodyText?: true
    scopeText?: true
    paymentSummary?: true
    successFeeRestricted?: true
    specialTerms?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ContractDraftCountAggregateInputType = {
    id?: true
    inquiryId?: true
    quoteId?: true
    status?: true
    title?: true
    bodyText?: true
    scopeText?: true
    paymentSummary?: true
    successFeeRestricted?: true
    specialTerms?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ContractDraftAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContractDraft to aggregate.
     */
    where?: ContractDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractDrafts to fetch.
     */
    orderBy?: ContractDraftOrderByWithRelationInput | ContractDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ContractDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractDrafts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ContractDrafts
    **/
    _count?: true | ContractDraftCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ContractDraftMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ContractDraftMaxAggregateInputType
  }

  export type GetContractDraftAggregateType<T extends ContractDraftAggregateArgs> = {
        [P in keyof T & keyof AggregateContractDraft]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateContractDraft[P]>
      : GetScalarType<T[P], AggregateContractDraft[P]>
  }




  export type ContractDraftGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ContractDraftWhereInput
    orderBy?: ContractDraftOrderByWithAggregationInput | ContractDraftOrderByWithAggregationInput[]
    by: ContractDraftScalarFieldEnum[] | ContractDraftScalarFieldEnum
    having?: ContractDraftScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ContractDraftCountAggregateInputType | true
    _min?: ContractDraftMinAggregateInputType
    _max?: ContractDraftMaxAggregateInputType
  }

  export type ContractDraftGroupByOutputType = {
    id: string
    inquiryId: string
    quoteId: string
    status: $Enums.ContractDraftStatus
    title: string
    bodyText: string
    scopeText: string | null
    paymentSummary: string | null
    successFeeRestricted: boolean
    specialTerms: string | null
    createdAt: Date
    updatedAt: Date
    _count: ContractDraftCountAggregateOutputType | null
    _min: ContractDraftMinAggregateOutputType | null
    _max: ContractDraftMaxAggregateOutputType | null
  }

  type GetContractDraftGroupByPayload<T extends ContractDraftGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ContractDraftGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ContractDraftGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ContractDraftGroupByOutputType[P]>
            : GetScalarType<T[P], ContractDraftGroupByOutputType[P]>
        }
      >
    >


  export type ContractDraftSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inquiryId?: boolean
    quoteId?: boolean
    status?: boolean
    title?: boolean
    bodyText?: boolean
    scopeText?: boolean
    paymentSummary?: boolean
    successFeeRestricted?: boolean
    specialTerms?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contractDraft"]>

  export type ContractDraftSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inquiryId?: boolean
    quoteId?: boolean
    status?: boolean
    title?: boolean
    bodyText?: boolean
    scopeText?: boolean
    paymentSummary?: boolean
    successFeeRestricted?: boolean
    specialTerms?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contractDraft"]>

  export type ContractDraftSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    inquiryId?: boolean
    quoteId?: boolean
    status?: boolean
    title?: boolean
    bodyText?: boolean
    scopeText?: boolean
    paymentSummary?: boolean
    successFeeRestricted?: boolean
    specialTerms?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["contractDraft"]>

  export type ContractDraftSelectScalar = {
    id?: boolean
    inquiryId?: boolean
    quoteId?: boolean
    status?: boolean
    title?: boolean
    bodyText?: boolean
    scopeText?: boolean
    paymentSummary?: boolean
    successFeeRestricted?: boolean
    specialTerms?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ContractDraftOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "inquiryId" | "quoteId" | "status" | "title" | "bodyText" | "scopeText" | "paymentSummary" | "successFeeRestricted" | "specialTerms" | "createdAt" | "updatedAt", ExtArgs["result"]["contractDraft"]>
  export type ContractDraftInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }
  export type ContractDraftIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }
  export type ContractDraftIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inquiry?: boolean | InquiryDefaultArgs<ExtArgs>
    quote?: boolean | QuoteDefaultArgs<ExtArgs>
  }

  export type $ContractDraftPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ContractDraft"
    objects: {
      inquiry: Prisma.$InquiryPayload<ExtArgs>
      quote: Prisma.$QuotePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      inquiryId: string
      quoteId: string
      status: $Enums.ContractDraftStatus
      title: string
      bodyText: string
      scopeText: string | null
      paymentSummary: string | null
      successFeeRestricted: boolean
      specialTerms: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["contractDraft"]>
    composites: {}
  }

  type ContractDraftGetPayload<S extends boolean | null | undefined | ContractDraftDefaultArgs> = $Result.GetResult<Prisma.$ContractDraftPayload, S>

  type ContractDraftCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ContractDraftFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ContractDraftCountAggregateInputType | true
    }

  export interface ContractDraftDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ContractDraft'], meta: { name: 'ContractDraft' } }
    /**
     * Find zero or one ContractDraft that matches the filter.
     * @param {ContractDraftFindUniqueArgs} args - Arguments to find a ContractDraft
     * @example
     * // Get one ContractDraft
     * const contractDraft = await prisma.contractDraft.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContractDraftFindUniqueArgs>(args: SelectSubset<T, ContractDraftFindUniqueArgs<ExtArgs>>): Prisma__ContractDraftClient<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ContractDraft that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContractDraftFindUniqueOrThrowArgs} args - Arguments to find a ContractDraft
     * @example
     * // Get one ContractDraft
     * const contractDraft = await prisma.contractDraft.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContractDraftFindUniqueOrThrowArgs>(args: SelectSubset<T, ContractDraftFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ContractDraftClient<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ContractDraft that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractDraftFindFirstArgs} args - Arguments to find a ContractDraft
     * @example
     * // Get one ContractDraft
     * const contractDraft = await prisma.contractDraft.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContractDraftFindFirstArgs>(args?: SelectSubset<T, ContractDraftFindFirstArgs<ExtArgs>>): Prisma__ContractDraftClient<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ContractDraft that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractDraftFindFirstOrThrowArgs} args - Arguments to find a ContractDraft
     * @example
     * // Get one ContractDraft
     * const contractDraft = await prisma.contractDraft.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContractDraftFindFirstOrThrowArgs>(args?: SelectSubset<T, ContractDraftFindFirstOrThrowArgs<ExtArgs>>): Prisma__ContractDraftClient<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ContractDrafts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractDraftFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContractDrafts
     * const contractDrafts = await prisma.contractDraft.findMany()
     * 
     * // Get first 10 ContractDrafts
     * const contractDrafts = await prisma.contractDraft.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const contractDraftWithIdOnly = await prisma.contractDraft.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ContractDraftFindManyArgs>(args?: SelectSubset<T, ContractDraftFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ContractDraft.
     * @param {ContractDraftCreateArgs} args - Arguments to create a ContractDraft.
     * @example
     * // Create one ContractDraft
     * const ContractDraft = await prisma.contractDraft.create({
     *   data: {
     *     // ... data to create a ContractDraft
     *   }
     * })
     * 
     */
    create<T extends ContractDraftCreateArgs>(args: SelectSubset<T, ContractDraftCreateArgs<ExtArgs>>): Prisma__ContractDraftClient<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ContractDrafts.
     * @param {ContractDraftCreateManyArgs} args - Arguments to create many ContractDrafts.
     * @example
     * // Create many ContractDrafts
     * const contractDraft = await prisma.contractDraft.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ContractDraftCreateManyArgs>(args?: SelectSubset<T, ContractDraftCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ContractDrafts and returns the data saved in the database.
     * @param {ContractDraftCreateManyAndReturnArgs} args - Arguments to create many ContractDrafts.
     * @example
     * // Create many ContractDrafts
     * const contractDraft = await prisma.contractDraft.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ContractDrafts and only return the `id`
     * const contractDraftWithIdOnly = await prisma.contractDraft.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ContractDraftCreateManyAndReturnArgs>(args?: SelectSubset<T, ContractDraftCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ContractDraft.
     * @param {ContractDraftDeleteArgs} args - Arguments to delete one ContractDraft.
     * @example
     * // Delete one ContractDraft
     * const ContractDraft = await prisma.contractDraft.delete({
     *   where: {
     *     // ... filter to delete one ContractDraft
     *   }
     * })
     * 
     */
    delete<T extends ContractDraftDeleteArgs>(args: SelectSubset<T, ContractDraftDeleteArgs<ExtArgs>>): Prisma__ContractDraftClient<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ContractDraft.
     * @param {ContractDraftUpdateArgs} args - Arguments to update one ContractDraft.
     * @example
     * // Update one ContractDraft
     * const contractDraft = await prisma.contractDraft.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ContractDraftUpdateArgs>(args: SelectSubset<T, ContractDraftUpdateArgs<ExtArgs>>): Prisma__ContractDraftClient<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ContractDrafts.
     * @param {ContractDraftDeleteManyArgs} args - Arguments to filter ContractDrafts to delete.
     * @example
     * // Delete a few ContractDrafts
     * const { count } = await prisma.contractDraft.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ContractDraftDeleteManyArgs>(args?: SelectSubset<T, ContractDraftDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContractDrafts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractDraftUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContractDrafts
     * const contractDraft = await prisma.contractDraft.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ContractDraftUpdateManyArgs>(args: SelectSubset<T, ContractDraftUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ContractDrafts and returns the data updated in the database.
     * @param {ContractDraftUpdateManyAndReturnArgs} args - Arguments to update many ContractDrafts.
     * @example
     * // Update many ContractDrafts
     * const contractDraft = await prisma.contractDraft.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ContractDrafts and only return the `id`
     * const contractDraftWithIdOnly = await prisma.contractDraft.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ContractDraftUpdateManyAndReturnArgs>(args: SelectSubset<T, ContractDraftUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ContractDraft.
     * @param {ContractDraftUpsertArgs} args - Arguments to update or create a ContractDraft.
     * @example
     * // Update or create a ContractDraft
     * const contractDraft = await prisma.contractDraft.upsert({
     *   create: {
     *     // ... data to create a ContractDraft
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContractDraft we want to update
     *   }
     * })
     */
    upsert<T extends ContractDraftUpsertArgs>(args: SelectSubset<T, ContractDraftUpsertArgs<ExtArgs>>): Prisma__ContractDraftClient<$Result.GetResult<Prisma.$ContractDraftPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ContractDrafts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractDraftCountArgs} args - Arguments to filter ContractDrafts to count.
     * @example
     * // Count the number of ContractDrafts
     * const count = await prisma.contractDraft.count({
     *   where: {
     *     // ... the filter for the ContractDrafts we want to count
     *   }
     * })
    **/
    count<T extends ContractDraftCountArgs>(
      args?: Subset<T, ContractDraftCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ContractDraftCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ContractDraft.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractDraftAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ContractDraftAggregateArgs>(args: Subset<T, ContractDraftAggregateArgs>): Prisma.PrismaPromise<GetContractDraftAggregateType<T>>

    /**
     * Group by ContractDraft.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContractDraftGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ContractDraftGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ContractDraftGroupByArgs['orderBy'] }
        : { orderBy?: ContractDraftGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ContractDraftGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContractDraftGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ContractDraft model
   */
  readonly fields: ContractDraftFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ContractDraft.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ContractDraftClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    inquiry<T extends InquiryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InquiryDefaultArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    quote<T extends QuoteDefaultArgs<ExtArgs> = {}>(args?: Subset<T, QuoteDefaultArgs<ExtArgs>>): Prisma__QuoteClient<$Result.GetResult<Prisma.$QuotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ContractDraft model
   */
  interface ContractDraftFieldRefs {
    readonly id: FieldRef<"ContractDraft", 'String'>
    readonly inquiryId: FieldRef<"ContractDraft", 'String'>
    readonly quoteId: FieldRef<"ContractDraft", 'String'>
    readonly status: FieldRef<"ContractDraft", 'ContractDraftStatus'>
    readonly title: FieldRef<"ContractDraft", 'String'>
    readonly bodyText: FieldRef<"ContractDraft", 'String'>
    readonly scopeText: FieldRef<"ContractDraft", 'String'>
    readonly paymentSummary: FieldRef<"ContractDraft", 'String'>
    readonly successFeeRestricted: FieldRef<"ContractDraft", 'Boolean'>
    readonly specialTerms: FieldRef<"ContractDraft", 'String'>
    readonly createdAt: FieldRef<"ContractDraft", 'DateTime'>
    readonly updatedAt: FieldRef<"ContractDraft", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ContractDraft findUnique
   */
  export type ContractDraftFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    /**
     * Filter, which ContractDraft to fetch.
     */
    where: ContractDraftWhereUniqueInput
  }

  /**
   * ContractDraft findUniqueOrThrow
   */
  export type ContractDraftFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    /**
     * Filter, which ContractDraft to fetch.
     */
    where: ContractDraftWhereUniqueInput
  }

  /**
   * ContractDraft findFirst
   */
  export type ContractDraftFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    /**
     * Filter, which ContractDraft to fetch.
     */
    where?: ContractDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractDrafts to fetch.
     */
    orderBy?: ContractDraftOrderByWithRelationInput | ContractDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContractDrafts.
     */
    cursor?: ContractDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractDrafts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContractDrafts.
     */
    distinct?: ContractDraftScalarFieldEnum | ContractDraftScalarFieldEnum[]
  }

  /**
   * ContractDraft findFirstOrThrow
   */
  export type ContractDraftFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    /**
     * Filter, which ContractDraft to fetch.
     */
    where?: ContractDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractDrafts to fetch.
     */
    orderBy?: ContractDraftOrderByWithRelationInput | ContractDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ContractDrafts.
     */
    cursor?: ContractDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractDrafts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ContractDrafts.
     */
    distinct?: ContractDraftScalarFieldEnum | ContractDraftScalarFieldEnum[]
  }

  /**
   * ContractDraft findMany
   */
  export type ContractDraftFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    /**
     * Filter, which ContractDrafts to fetch.
     */
    where?: ContractDraftWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ContractDrafts to fetch.
     */
    orderBy?: ContractDraftOrderByWithRelationInput | ContractDraftOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ContractDrafts.
     */
    cursor?: ContractDraftWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ContractDrafts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ContractDrafts.
     */
    skip?: number
    distinct?: ContractDraftScalarFieldEnum | ContractDraftScalarFieldEnum[]
  }

  /**
   * ContractDraft create
   */
  export type ContractDraftCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    /**
     * The data needed to create a ContractDraft.
     */
    data: XOR<ContractDraftCreateInput, ContractDraftUncheckedCreateInput>
  }

  /**
   * ContractDraft createMany
   */
  export type ContractDraftCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContractDrafts.
     */
    data: ContractDraftCreateManyInput | ContractDraftCreateManyInput[]
  }

  /**
   * ContractDraft createManyAndReturn
   */
  export type ContractDraftCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * The data used to create many ContractDrafts.
     */
    data: ContractDraftCreateManyInput | ContractDraftCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ContractDraft update
   */
  export type ContractDraftUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    /**
     * The data needed to update a ContractDraft.
     */
    data: XOR<ContractDraftUpdateInput, ContractDraftUncheckedUpdateInput>
    /**
     * Choose, which ContractDraft to update.
     */
    where: ContractDraftWhereUniqueInput
  }

  /**
   * ContractDraft updateMany
   */
  export type ContractDraftUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ContractDrafts.
     */
    data: XOR<ContractDraftUpdateManyMutationInput, ContractDraftUncheckedUpdateManyInput>
    /**
     * Filter which ContractDrafts to update
     */
    where?: ContractDraftWhereInput
    /**
     * Limit how many ContractDrafts to update.
     */
    limit?: number
  }

  /**
   * ContractDraft updateManyAndReturn
   */
  export type ContractDraftUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * The data used to update ContractDrafts.
     */
    data: XOR<ContractDraftUpdateManyMutationInput, ContractDraftUncheckedUpdateManyInput>
    /**
     * Filter which ContractDrafts to update
     */
    where?: ContractDraftWhereInput
    /**
     * Limit how many ContractDrafts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ContractDraft upsert
   */
  export type ContractDraftUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    /**
     * The filter to search for the ContractDraft to update in case it exists.
     */
    where: ContractDraftWhereUniqueInput
    /**
     * In case the ContractDraft found by the `where` argument doesn't exist, create a new ContractDraft with this data.
     */
    create: XOR<ContractDraftCreateInput, ContractDraftUncheckedCreateInput>
    /**
     * In case the ContractDraft was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ContractDraftUpdateInput, ContractDraftUncheckedUpdateInput>
  }

  /**
   * ContractDraft delete
   */
  export type ContractDraftDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
    /**
     * Filter which ContractDraft to delete.
     */
    where: ContractDraftWhereUniqueInput
  }

  /**
   * ContractDraft deleteMany
   */
  export type ContractDraftDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ContractDrafts to delete
     */
    where?: ContractDraftWhereInput
    /**
     * Limit how many ContractDrafts to delete.
     */
    limit?: number
  }

  /**
   * ContractDraft without action
   */
  export type ContractDraftDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContractDraft
     */
    select?: ContractDraftSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ContractDraft
     */
    omit?: ContractDraftOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ContractDraftInclude<ExtArgs> | null
  }


  /**
   * Model LegacyImportLog
   */

  export type AggregateLegacyImportLog = {
    _count: LegacyImportLogCountAggregateOutputType | null
    _avg: LegacyImportLogAvgAggregateOutputType | null
    _sum: LegacyImportLogSumAggregateOutputType | null
    _min: LegacyImportLogMinAggregateOutputType | null
    _max: LegacyImportLogMaxAggregateOutputType | null
  }

  export type LegacyImportLogAvgAggregateOutputType = {
    createdCount: number | null
  }

  export type LegacyImportLogSumAggregateOutputType = {
    createdCount: number | null
  }

  export type LegacyImportLogMinAggregateOutputType = {
    id: string | null
    source: string | null
    version: string | null
    payloadJson: string | null
    importedAt: Date | null
    createdCount: number | null
  }

  export type LegacyImportLogMaxAggregateOutputType = {
    id: string | null
    source: string | null
    version: string | null
    payloadJson: string | null
    importedAt: Date | null
    createdCount: number | null
  }

  export type LegacyImportLogCountAggregateOutputType = {
    id: number
    source: number
    version: number
    payloadJson: number
    importedAt: number
    createdCount: number
    _all: number
  }


  export type LegacyImportLogAvgAggregateInputType = {
    createdCount?: true
  }

  export type LegacyImportLogSumAggregateInputType = {
    createdCount?: true
  }

  export type LegacyImportLogMinAggregateInputType = {
    id?: true
    source?: true
    version?: true
    payloadJson?: true
    importedAt?: true
    createdCount?: true
  }

  export type LegacyImportLogMaxAggregateInputType = {
    id?: true
    source?: true
    version?: true
    payloadJson?: true
    importedAt?: true
    createdCount?: true
  }

  export type LegacyImportLogCountAggregateInputType = {
    id?: true
    source?: true
    version?: true
    payloadJson?: true
    importedAt?: true
    createdCount?: true
    _all?: true
  }

  export type LegacyImportLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LegacyImportLog to aggregate.
     */
    where?: LegacyImportLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LegacyImportLogs to fetch.
     */
    orderBy?: LegacyImportLogOrderByWithRelationInput | LegacyImportLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LegacyImportLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LegacyImportLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LegacyImportLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LegacyImportLogs
    **/
    _count?: true | LegacyImportLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LegacyImportLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LegacyImportLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LegacyImportLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LegacyImportLogMaxAggregateInputType
  }

  export type GetLegacyImportLogAggregateType<T extends LegacyImportLogAggregateArgs> = {
        [P in keyof T & keyof AggregateLegacyImportLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLegacyImportLog[P]>
      : GetScalarType<T[P], AggregateLegacyImportLog[P]>
  }




  export type LegacyImportLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LegacyImportLogWhereInput
    orderBy?: LegacyImportLogOrderByWithAggregationInput | LegacyImportLogOrderByWithAggregationInput[]
    by: LegacyImportLogScalarFieldEnum[] | LegacyImportLogScalarFieldEnum
    having?: LegacyImportLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LegacyImportLogCountAggregateInputType | true
    _avg?: LegacyImportLogAvgAggregateInputType
    _sum?: LegacyImportLogSumAggregateInputType
    _min?: LegacyImportLogMinAggregateInputType
    _max?: LegacyImportLogMaxAggregateInputType
  }

  export type LegacyImportLogGroupByOutputType = {
    id: string
    source: string
    version: string
    payloadJson: string | null
    importedAt: Date
    createdCount: number
    _count: LegacyImportLogCountAggregateOutputType | null
    _avg: LegacyImportLogAvgAggregateOutputType | null
    _sum: LegacyImportLogSumAggregateOutputType | null
    _min: LegacyImportLogMinAggregateOutputType | null
    _max: LegacyImportLogMaxAggregateOutputType | null
  }

  type GetLegacyImportLogGroupByPayload<T extends LegacyImportLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LegacyImportLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LegacyImportLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LegacyImportLogGroupByOutputType[P]>
            : GetScalarType<T[P], LegacyImportLogGroupByOutputType[P]>
        }
      >
    >


  export type LegacyImportLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    version?: boolean
    payloadJson?: boolean
    importedAt?: boolean
    createdCount?: boolean
  }, ExtArgs["result"]["legacyImportLog"]>

  export type LegacyImportLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    version?: boolean
    payloadJson?: boolean
    importedAt?: boolean
    createdCount?: boolean
  }, ExtArgs["result"]["legacyImportLog"]>

  export type LegacyImportLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    version?: boolean
    payloadJson?: boolean
    importedAt?: boolean
    createdCount?: boolean
  }, ExtArgs["result"]["legacyImportLog"]>

  export type LegacyImportLogSelectScalar = {
    id?: boolean
    source?: boolean
    version?: boolean
    payloadJson?: boolean
    importedAt?: boolean
    createdCount?: boolean
  }

  export type LegacyImportLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "source" | "version" | "payloadJson" | "importedAt" | "createdCount", ExtArgs["result"]["legacyImportLog"]>

  export type $LegacyImportLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LegacyImportLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      source: string
      version: string
      payloadJson: string | null
      importedAt: Date
      createdCount: number
    }, ExtArgs["result"]["legacyImportLog"]>
    composites: {}
  }

  type LegacyImportLogGetPayload<S extends boolean | null | undefined | LegacyImportLogDefaultArgs> = $Result.GetResult<Prisma.$LegacyImportLogPayload, S>

  type LegacyImportLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LegacyImportLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LegacyImportLogCountAggregateInputType | true
    }

  export interface LegacyImportLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LegacyImportLog'], meta: { name: 'LegacyImportLog' } }
    /**
     * Find zero or one LegacyImportLog that matches the filter.
     * @param {LegacyImportLogFindUniqueArgs} args - Arguments to find a LegacyImportLog
     * @example
     * // Get one LegacyImportLog
     * const legacyImportLog = await prisma.legacyImportLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LegacyImportLogFindUniqueArgs>(args: SelectSubset<T, LegacyImportLogFindUniqueArgs<ExtArgs>>): Prisma__LegacyImportLogClient<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one LegacyImportLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LegacyImportLogFindUniqueOrThrowArgs} args - Arguments to find a LegacyImportLog
     * @example
     * // Get one LegacyImportLog
     * const legacyImportLog = await prisma.legacyImportLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LegacyImportLogFindUniqueOrThrowArgs>(args: SelectSubset<T, LegacyImportLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LegacyImportLogClient<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LegacyImportLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LegacyImportLogFindFirstArgs} args - Arguments to find a LegacyImportLog
     * @example
     * // Get one LegacyImportLog
     * const legacyImportLog = await prisma.legacyImportLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LegacyImportLogFindFirstArgs>(args?: SelectSubset<T, LegacyImportLogFindFirstArgs<ExtArgs>>): Prisma__LegacyImportLogClient<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LegacyImportLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LegacyImportLogFindFirstOrThrowArgs} args - Arguments to find a LegacyImportLog
     * @example
     * // Get one LegacyImportLog
     * const legacyImportLog = await prisma.legacyImportLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LegacyImportLogFindFirstOrThrowArgs>(args?: SelectSubset<T, LegacyImportLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__LegacyImportLogClient<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more LegacyImportLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LegacyImportLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LegacyImportLogs
     * const legacyImportLogs = await prisma.legacyImportLog.findMany()
     * 
     * // Get first 10 LegacyImportLogs
     * const legacyImportLogs = await prisma.legacyImportLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const legacyImportLogWithIdOnly = await prisma.legacyImportLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LegacyImportLogFindManyArgs>(args?: SelectSubset<T, LegacyImportLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a LegacyImportLog.
     * @param {LegacyImportLogCreateArgs} args - Arguments to create a LegacyImportLog.
     * @example
     * // Create one LegacyImportLog
     * const LegacyImportLog = await prisma.legacyImportLog.create({
     *   data: {
     *     // ... data to create a LegacyImportLog
     *   }
     * })
     * 
     */
    create<T extends LegacyImportLogCreateArgs>(args: SelectSubset<T, LegacyImportLogCreateArgs<ExtArgs>>): Prisma__LegacyImportLogClient<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many LegacyImportLogs.
     * @param {LegacyImportLogCreateManyArgs} args - Arguments to create many LegacyImportLogs.
     * @example
     * // Create many LegacyImportLogs
     * const legacyImportLog = await prisma.legacyImportLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LegacyImportLogCreateManyArgs>(args?: SelectSubset<T, LegacyImportLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LegacyImportLogs and returns the data saved in the database.
     * @param {LegacyImportLogCreateManyAndReturnArgs} args - Arguments to create many LegacyImportLogs.
     * @example
     * // Create many LegacyImportLogs
     * const legacyImportLog = await prisma.legacyImportLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LegacyImportLogs and only return the `id`
     * const legacyImportLogWithIdOnly = await prisma.legacyImportLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LegacyImportLogCreateManyAndReturnArgs>(args?: SelectSubset<T, LegacyImportLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a LegacyImportLog.
     * @param {LegacyImportLogDeleteArgs} args - Arguments to delete one LegacyImportLog.
     * @example
     * // Delete one LegacyImportLog
     * const LegacyImportLog = await prisma.legacyImportLog.delete({
     *   where: {
     *     // ... filter to delete one LegacyImportLog
     *   }
     * })
     * 
     */
    delete<T extends LegacyImportLogDeleteArgs>(args: SelectSubset<T, LegacyImportLogDeleteArgs<ExtArgs>>): Prisma__LegacyImportLogClient<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one LegacyImportLog.
     * @param {LegacyImportLogUpdateArgs} args - Arguments to update one LegacyImportLog.
     * @example
     * // Update one LegacyImportLog
     * const legacyImportLog = await prisma.legacyImportLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LegacyImportLogUpdateArgs>(args: SelectSubset<T, LegacyImportLogUpdateArgs<ExtArgs>>): Prisma__LegacyImportLogClient<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more LegacyImportLogs.
     * @param {LegacyImportLogDeleteManyArgs} args - Arguments to filter LegacyImportLogs to delete.
     * @example
     * // Delete a few LegacyImportLogs
     * const { count } = await prisma.legacyImportLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LegacyImportLogDeleteManyArgs>(args?: SelectSubset<T, LegacyImportLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LegacyImportLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LegacyImportLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LegacyImportLogs
     * const legacyImportLog = await prisma.legacyImportLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LegacyImportLogUpdateManyArgs>(args: SelectSubset<T, LegacyImportLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LegacyImportLogs and returns the data updated in the database.
     * @param {LegacyImportLogUpdateManyAndReturnArgs} args - Arguments to update many LegacyImportLogs.
     * @example
     * // Update many LegacyImportLogs
     * const legacyImportLog = await prisma.legacyImportLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more LegacyImportLogs and only return the `id`
     * const legacyImportLogWithIdOnly = await prisma.legacyImportLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LegacyImportLogUpdateManyAndReturnArgs>(args: SelectSubset<T, LegacyImportLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one LegacyImportLog.
     * @param {LegacyImportLogUpsertArgs} args - Arguments to update or create a LegacyImportLog.
     * @example
     * // Update or create a LegacyImportLog
     * const legacyImportLog = await prisma.legacyImportLog.upsert({
     *   create: {
     *     // ... data to create a LegacyImportLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LegacyImportLog we want to update
     *   }
     * })
     */
    upsert<T extends LegacyImportLogUpsertArgs>(args: SelectSubset<T, LegacyImportLogUpsertArgs<ExtArgs>>): Prisma__LegacyImportLogClient<$Result.GetResult<Prisma.$LegacyImportLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of LegacyImportLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LegacyImportLogCountArgs} args - Arguments to filter LegacyImportLogs to count.
     * @example
     * // Count the number of LegacyImportLogs
     * const count = await prisma.legacyImportLog.count({
     *   where: {
     *     // ... the filter for the LegacyImportLogs we want to count
     *   }
     * })
    **/
    count<T extends LegacyImportLogCountArgs>(
      args?: Subset<T, LegacyImportLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LegacyImportLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LegacyImportLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LegacyImportLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LegacyImportLogAggregateArgs>(args: Subset<T, LegacyImportLogAggregateArgs>): Prisma.PrismaPromise<GetLegacyImportLogAggregateType<T>>

    /**
     * Group by LegacyImportLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LegacyImportLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LegacyImportLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LegacyImportLogGroupByArgs['orderBy'] }
        : { orderBy?: LegacyImportLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LegacyImportLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLegacyImportLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LegacyImportLog model
   */
  readonly fields: LegacyImportLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LegacyImportLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LegacyImportLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LegacyImportLog model
   */
  interface LegacyImportLogFieldRefs {
    readonly id: FieldRef<"LegacyImportLog", 'String'>
    readonly source: FieldRef<"LegacyImportLog", 'String'>
    readonly version: FieldRef<"LegacyImportLog", 'String'>
    readonly payloadJson: FieldRef<"LegacyImportLog", 'String'>
    readonly importedAt: FieldRef<"LegacyImportLog", 'DateTime'>
    readonly createdCount: FieldRef<"LegacyImportLog", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * LegacyImportLog findUnique
   */
  export type LegacyImportLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * Filter, which LegacyImportLog to fetch.
     */
    where: LegacyImportLogWhereUniqueInput
  }

  /**
   * LegacyImportLog findUniqueOrThrow
   */
  export type LegacyImportLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * Filter, which LegacyImportLog to fetch.
     */
    where: LegacyImportLogWhereUniqueInput
  }

  /**
   * LegacyImportLog findFirst
   */
  export type LegacyImportLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * Filter, which LegacyImportLog to fetch.
     */
    where?: LegacyImportLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LegacyImportLogs to fetch.
     */
    orderBy?: LegacyImportLogOrderByWithRelationInput | LegacyImportLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LegacyImportLogs.
     */
    cursor?: LegacyImportLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LegacyImportLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LegacyImportLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LegacyImportLogs.
     */
    distinct?: LegacyImportLogScalarFieldEnum | LegacyImportLogScalarFieldEnum[]
  }

  /**
   * LegacyImportLog findFirstOrThrow
   */
  export type LegacyImportLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * Filter, which LegacyImportLog to fetch.
     */
    where?: LegacyImportLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LegacyImportLogs to fetch.
     */
    orderBy?: LegacyImportLogOrderByWithRelationInput | LegacyImportLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LegacyImportLogs.
     */
    cursor?: LegacyImportLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LegacyImportLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LegacyImportLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LegacyImportLogs.
     */
    distinct?: LegacyImportLogScalarFieldEnum | LegacyImportLogScalarFieldEnum[]
  }

  /**
   * LegacyImportLog findMany
   */
  export type LegacyImportLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * Filter, which LegacyImportLogs to fetch.
     */
    where?: LegacyImportLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LegacyImportLogs to fetch.
     */
    orderBy?: LegacyImportLogOrderByWithRelationInput | LegacyImportLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LegacyImportLogs.
     */
    cursor?: LegacyImportLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LegacyImportLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LegacyImportLogs.
     */
    skip?: number
    distinct?: LegacyImportLogScalarFieldEnum | LegacyImportLogScalarFieldEnum[]
  }

  /**
   * LegacyImportLog create
   */
  export type LegacyImportLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * The data needed to create a LegacyImportLog.
     */
    data: XOR<LegacyImportLogCreateInput, LegacyImportLogUncheckedCreateInput>
  }

  /**
   * LegacyImportLog createMany
   */
  export type LegacyImportLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LegacyImportLogs.
     */
    data: LegacyImportLogCreateManyInput | LegacyImportLogCreateManyInput[]
  }

  /**
   * LegacyImportLog createManyAndReturn
   */
  export type LegacyImportLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * The data used to create many LegacyImportLogs.
     */
    data: LegacyImportLogCreateManyInput | LegacyImportLogCreateManyInput[]
  }

  /**
   * LegacyImportLog update
   */
  export type LegacyImportLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * The data needed to update a LegacyImportLog.
     */
    data: XOR<LegacyImportLogUpdateInput, LegacyImportLogUncheckedUpdateInput>
    /**
     * Choose, which LegacyImportLog to update.
     */
    where: LegacyImportLogWhereUniqueInput
  }

  /**
   * LegacyImportLog updateMany
   */
  export type LegacyImportLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LegacyImportLogs.
     */
    data: XOR<LegacyImportLogUpdateManyMutationInput, LegacyImportLogUncheckedUpdateManyInput>
    /**
     * Filter which LegacyImportLogs to update
     */
    where?: LegacyImportLogWhereInput
    /**
     * Limit how many LegacyImportLogs to update.
     */
    limit?: number
  }

  /**
   * LegacyImportLog updateManyAndReturn
   */
  export type LegacyImportLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * The data used to update LegacyImportLogs.
     */
    data: XOR<LegacyImportLogUpdateManyMutationInput, LegacyImportLogUncheckedUpdateManyInput>
    /**
     * Filter which LegacyImportLogs to update
     */
    where?: LegacyImportLogWhereInput
    /**
     * Limit how many LegacyImportLogs to update.
     */
    limit?: number
  }

  /**
   * LegacyImportLog upsert
   */
  export type LegacyImportLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * The filter to search for the LegacyImportLog to update in case it exists.
     */
    where: LegacyImportLogWhereUniqueInput
    /**
     * In case the LegacyImportLog found by the `where` argument doesn't exist, create a new LegacyImportLog with this data.
     */
    create: XOR<LegacyImportLogCreateInput, LegacyImportLogUncheckedCreateInput>
    /**
     * In case the LegacyImportLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LegacyImportLogUpdateInput, LegacyImportLogUncheckedUpdateInput>
  }

  /**
   * LegacyImportLog delete
   */
  export type LegacyImportLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
    /**
     * Filter which LegacyImportLog to delete.
     */
    where: LegacyImportLogWhereUniqueInput
  }

  /**
   * LegacyImportLog deleteMany
   */
  export type LegacyImportLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LegacyImportLogs to delete
     */
    where?: LegacyImportLogWhereInput
    /**
     * Limit how many LegacyImportLogs to delete.
     */
    limit?: number
  }

  /**
   * LegacyImportLog without action
   */
  export type LegacyImportLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LegacyImportLog
     */
    select?: LegacyImportLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the LegacyImportLog
     */
    omit?: LegacyImportLogOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const InquiryScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    status: 'status',
    inquiryType: 'inquiryType',
    urgencyLevel: 'urgencyLevel',
    classificationConfidence: 'classificationConfidence',
    qualificationScore: 'qualificationScore',
    preferredLanguage: 'preferredLanguage',
    clientType: 'clientType',
    contactName: 'contactName',
    organizationName: 'organizationName',
    email: 'email',
    phone: 'phone',
    title: 'title',
    description: 'description',
    nationality: 'nationality',
    currentStatus: 'currentStatus',
    documentCountry: 'documentCountry',
    targetAgency: 'targetAgency',
    dueDate: 'dueDate',
    assignee: 'assignee',
    internalMemo: 'internalMemo',
    wantsCallback: 'wantsCallback',
    consentToPrivacy: 'consentToPrivacy',
    intakeSource: 'intakeSource',
    generatedSummary: 'generatedSummary',
    generatedGuidance: 'generatedGuidance',
    generatedReceiptMessage: 'generatedReceiptMessage',
    classificationReason: 'classificationReason',
    recommendedNextStep: 'recommendedNextStep',
    serviceTags: 'serviceTags'
  };

  export type InquiryScalarFieldEnum = (typeof InquiryScalarFieldEnum)[keyof typeof InquiryScalarFieldEnum]


  export const ServiceTypeScalarFieldEnum: {
    id: 'id',
    legacyId: 'legacyId',
    name: 'name',
    category: 'category',
    minPrice: 'minPrice',
    maxPrice: 'maxPrice',
    isAppeal: 'isAppeal',
    isActive: 'isActive',
    source: 'source',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ServiceTypeScalarFieldEnum = (typeof ServiceTypeScalarFieldEnum)[keyof typeof ServiceTypeScalarFieldEnum]


  export const PricingOptionScalarFieldEnum: {
    id: 'id',
    legacyId: 'legacyId',
    name: 'name',
    description: 'description',
    optionType: 'optionType',
    flatAmount: 'flatAmount',
    percentRate: 'percentRate',
    unitLabel: 'unitLabel',
    isVat: 'isVat',
    isActive: 'isActive',
    source: 'source',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PricingOptionScalarFieldEnum = (typeof PricingOptionScalarFieldEnum)[keyof typeof PricingOptionScalarFieldEnum]


  export const PricingRuleScalarFieldEnum: {
    id: 'id',
    code: 'code',
    ruleType: 'ruleType',
    label: 'label',
    description: 'description',
    numericValue: 'numericValue',
    percentValue: 'percentValue',
    jsonValue: 'jsonValue',
    isDefault: 'isDefault',
    isActive: 'isActive',
    source: 'source',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PricingRuleScalarFieldEnum = (typeof PricingRuleScalarFieldEnum)[keyof typeof PricingRuleScalarFieldEnum]


  export const QuoteScalarFieldEnum: {
    id: 'id',
    inquiryId: 'inquiryId',
    status: 'status',
    selectedServiceLegacyIds: 'selectedServiceLegacyIds',
    selectedOptionLegacyIds: 'selectedOptionLegacyIds',
    urgencyRuleCode: 'urgencyRuleCode',
    consultRuleCode: 'consultRuleCode',
    paymentRuleCode: 'paymentRuleCode',
    rangeMode: 'rangeMode',
    serviceBaseMin: 'serviceBaseMin',
    serviceBaseMax: 'serviceBaseMax',
    subtotalMin: 'subtotalMin',
    subtotalMax: 'subtotalMax',
    vatAmountMin: 'vatAmountMin',
    vatAmountMax: 'vatAmountMax',
    totalMin: 'totalMin',
    totalMax: 'totalMax',
    consultFee: 'consultFee',
    successFeeRestricted: 'successFeeRestricted',
    draftNotes: 'draftNotes',
    calculationSummary: 'calculationSummary',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type QuoteScalarFieldEnum = (typeof QuoteScalarFieldEnum)[keyof typeof QuoteScalarFieldEnum]


  export const QuoteLineItemScalarFieldEnum: {
    id: 'id',
    quoteId: 'quoteId',
    serviceTypeId: 'serviceTypeId',
    kind: 'kind',
    label: 'label',
    description: 'description',
    amountMin: 'amountMin',
    amountMax: 'amountMax',
    sortOrder: 'sortOrder',
    isManual: 'isManual',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type QuoteLineItemScalarFieldEnum = (typeof QuoteLineItemScalarFieldEnum)[keyof typeof QuoteLineItemScalarFieldEnum]


  export const QuoteAdjustmentScalarFieldEnum: {
    id: 'id',
    quoteId: 'quoteId',
    pricingOptionId: 'pricingOptionId',
    label: 'label',
    description: 'description',
    optionType: 'optionType',
    flatAmount: 'flatAmount',
    percentRate: 'percentRate',
    computedMin: 'computedMin',
    computedMax: 'computedMax',
    isVat: 'isVat',
    sortOrder: 'sortOrder',
    isManual: 'isManual',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type QuoteAdjustmentScalarFieldEnum = (typeof QuoteAdjustmentScalarFieldEnum)[keyof typeof QuoteAdjustmentScalarFieldEnum]


  export const PaymentPlanScalarFieldEnum: {
    id: 'id',
    quoteId: 'quoteId',
    stageKind: 'stageKind',
    percentage: 'percentage',
    dueText: 'dueText',
    amountMin: 'amountMin',
    amountMax: 'amountMax',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PaymentPlanScalarFieldEnum = (typeof PaymentPlanScalarFieldEnum)[keyof typeof PaymentPlanScalarFieldEnum]


  export const ContractDraftScalarFieldEnum: {
    id: 'id',
    inquiryId: 'inquiryId',
    quoteId: 'quoteId',
    status: 'status',
    title: 'title',
    bodyText: 'bodyText',
    scopeText: 'scopeText',
    paymentSummary: 'paymentSummary',
    successFeeRestricted: 'successFeeRestricted',
    specialTerms: 'specialTerms',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ContractDraftScalarFieldEnum = (typeof ContractDraftScalarFieldEnum)[keyof typeof ContractDraftScalarFieldEnum]


  export const LegacyImportLogScalarFieldEnum: {
    id: 'id',
    source: 'source',
    version: 'version',
    payloadJson: 'payloadJson',
    importedAt: 'importedAt',
    createdCount: 'createdCount'
  };

  export type LegacyImportLogScalarFieldEnum = (typeof LegacyImportLogScalarFieldEnum)[keyof typeof LegacyImportLogScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'InquiryStatus'
   */
  export type EnumInquiryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InquiryStatus'>
    


  /**
   * Reference to a field of type 'InquiryType'
   */
  export type EnumInquiryTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'InquiryType'>
    


  /**
   * Reference to a field of type 'UrgencyLevel'
   */
  export type EnumUrgencyLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UrgencyLevel'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'LanguageCode'
   */
  export type EnumLanguageCodeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LanguageCode'>
    


  /**
   * Reference to a field of type 'ClientType'
   */
  export type EnumClientTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ClientType'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'PricingOptionType'
   */
  export type EnumPricingOptionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PricingOptionType'>
    


  /**
   * Reference to a field of type 'PricingRuleType'
   */
  export type EnumPricingRuleTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PricingRuleType'>
    


  /**
   * Reference to a field of type 'QuoteStatus'
   */
  export type EnumQuoteStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuoteStatus'>
    


  /**
   * Reference to a field of type 'QuoteLineKind'
   */
  export type EnumQuoteLineKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QuoteLineKind'>
    


  /**
   * Reference to a field of type 'PaymentStageKind'
   */
  export type EnumPaymentStageKindFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStageKind'>
    


  /**
   * Reference to a field of type 'ContractDraftStatus'
   */
  export type EnumContractDraftStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ContractDraftStatus'>
    
  /**
   * Deep Input Types
   */


  export type InquiryWhereInput = {
    AND?: InquiryWhereInput | InquiryWhereInput[]
    OR?: InquiryWhereInput[]
    NOT?: InquiryWhereInput | InquiryWhereInput[]
    id?: StringFilter<"Inquiry"> | string
    createdAt?: DateTimeFilter<"Inquiry"> | Date | string
    updatedAt?: DateTimeFilter<"Inquiry"> | Date | string
    status?: EnumInquiryStatusFilter<"Inquiry"> | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeFilter<"Inquiry"> | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelFilter<"Inquiry"> | $Enums.UrgencyLevel
    classificationConfidence?: FloatFilter<"Inquiry"> | number
    qualificationScore?: IntFilter<"Inquiry"> | number
    preferredLanguage?: EnumLanguageCodeFilter<"Inquiry"> | $Enums.LanguageCode
    clientType?: EnumClientTypeFilter<"Inquiry"> | $Enums.ClientType
    contactName?: StringFilter<"Inquiry"> | string
    organizationName?: StringNullableFilter<"Inquiry"> | string | null
    email?: StringFilter<"Inquiry"> | string
    phone?: StringNullableFilter<"Inquiry"> | string | null
    title?: StringFilter<"Inquiry"> | string
    description?: StringFilter<"Inquiry"> | string
    nationality?: StringNullableFilter<"Inquiry"> | string | null
    currentStatus?: StringNullableFilter<"Inquiry"> | string | null
    documentCountry?: StringNullableFilter<"Inquiry"> | string | null
    targetAgency?: StringNullableFilter<"Inquiry"> | string | null
    dueDate?: DateTimeNullableFilter<"Inquiry"> | Date | string | null
    assignee?: StringNullableFilter<"Inquiry"> | string | null
    internalMemo?: StringNullableFilter<"Inquiry"> | string | null
    wantsCallback?: BoolFilter<"Inquiry"> | boolean
    consentToPrivacy?: BoolFilter<"Inquiry"> | boolean
    intakeSource?: StringFilter<"Inquiry"> | string
    generatedSummary?: StringFilter<"Inquiry"> | string
    generatedGuidance?: StringFilter<"Inquiry"> | string
    generatedReceiptMessage?: StringFilter<"Inquiry"> | string
    classificationReason?: StringFilter<"Inquiry"> | string
    recommendedNextStep?: StringFilter<"Inquiry"> | string
    serviceTags?: StringFilter<"Inquiry"> | string
    quotes?: QuoteListRelationFilter
    contractDrafts?: ContractDraftListRelationFilter
  }

  export type InquiryOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    status?: SortOrder
    inquiryType?: SortOrder
    urgencyLevel?: SortOrder
    classificationConfidence?: SortOrder
    qualificationScore?: SortOrder
    preferredLanguage?: SortOrder
    clientType?: SortOrder
    contactName?: SortOrder
    organizationName?: SortOrderInput | SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    title?: SortOrder
    description?: SortOrder
    nationality?: SortOrderInput | SortOrder
    currentStatus?: SortOrderInput | SortOrder
    documentCountry?: SortOrderInput | SortOrder
    targetAgency?: SortOrderInput | SortOrder
    dueDate?: SortOrderInput | SortOrder
    assignee?: SortOrderInput | SortOrder
    internalMemo?: SortOrderInput | SortOrder
    wantsCallback?: SortOrder
    consentToPrivacy?: SortOrder
    intakeSource?: SortOrder
    generatedSummary?: SortOrder
    generatedGuidance?: SortOrder
    generatedReceiptMessage?: SortOrder
    classificationReason?: SortOrder
    recommendedNextStep?: SortOrder
    serviceTags?: SortOrder
    quotes?: QuoteOrderByRelationAggregateInput
    contractDrafts?: ContractDraftOrderByRelationAggregateInput
  }

  export type InquiryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: InquiryWhereInput | InquiryWhereInput[]
    OR?: InquiryWhereInput[]
    NOT?: InquiryWhereInput | InquiryWhereInput[]
    createdAt?: DateTimeFilter<"Inquiry"> | Date | string
    updatedAt?: DateTimeFilter<"Inquiry"> | Date | string
    status?: EnumInquiryStatusFilter<"Inquiry"> | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeFilter<"Inquiry"> | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelFilter<"Inquiry"> | $Enums.UrgencyLevel
    classificationConfidence?: FloatFilter<"Inquiry"> | number
    qualificationScore?: IntFilter<"Inquiry"> | number
    preferredLanguage?: EnumLanguageCodeFilter<"Inquiry"> | $Enums.LanguageCode
    clientType?: EnumClientTypeFilter<"Inquiry"> | $Enums.ClientType
    contactName?: StringFilter<"Inquiry"> | string
    organizationName?: StringNullableFilter<"Inquiry"> | string | null
    email?: StringFilter<"Inquiry"> | string
    phone?: StringNullableFilter<"Inquiry"> | string | null
    title?: StringFilter<"Inquiry"> | string
    description?: StringFilter<"Inquiry"> | string
    nationality?: StringNullableFilter<"Inquiry"> | string | null
    currentStatus?: StringNullableFilter<"Inquiry"> | string | null
    documentCountry?: StringNullableFilter<"Inquiry"> | string | null
    targetAgency?: StringNullableFilter<"Inquiry"> | string | null
    dueDate?: DateTimeNullableFilter<"Inquiry"> | Date | string | null
    assignee?: StringNullableFilter<"Inquiry"> | string | null
    internalMemo?: StringNullableFilter<"Inquiry"> | string | null
    wantsCallback?: BoolFilter<"Inquiry"> | boolean
    consentToPrivacy?: BoolFilter<"Inquiry"> | boolean
    intakeSource?: StringFilter<"Inquiry"> | string
    generatedSummary?: StringFilter<"Inquiry"> | string
    generatedGuidance?: StringFilter<"Inquiry"> | string
    generatedReceiptMessage?: StringFilter<"Inquiry"> | string
    classificationReason?: StringFilter<"Inquiry"> | string
    recommendedNextStep?: StringFilter<"Inquiry"> | string
    serviceTags?: StringFilter<"Inquiry"> | string
    quotes?: QuoteListRelationFilter
    contractDrafts?: ContractDraftListRelationFilter
  }, "id">

  export type InquiryOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    status?: SortOrder
    inquiryType?: SortOrder
    urgencyLevel?: SortOrder
    classificationConfidence?: SortOrder
    qualificationScore?: SortOrder
    preferredLanguage?: SortOrder
    clientType?: SortOrder
    contactName?: SortOrder
    organizationName?: SortOrderInput | SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    title?: SortOrder
    description?: SortOrder
    nationality?: SortOrderInput | SortOrder
    currentStatus?: SortOrderInput | SortOrder
    documentCountry?: SortOrderInput | SortOrder
    targetAgency?: SortOrderInput | SortOrder
    dueDate?: SortOrderInput | SortOrder
    assignee?: SortOrderInput | SortOrder
    internalMemo?: SortOrderInput | SortOrder
    wantsCallback?: SortOrder
    consentToPrivacy?: SortOrder
    intakeSource?: SortOrder
    generatedSummary?: SortOrder
    generatedGuidance?: SortOrder
    generatedReceiptMessage?: SortOrder
    classificationReason?: SortOrder
    recommendedNextStep?: SortOrder
    serviceTags?: SortOrder
    _count?: InquiryCountOrderByAggregateInput
    _avg?: InquiryAvgOrderByAggregateInput
    _max?: InquiryMaxOrderByAggregateInput
    _min?: InquiryMinOrderByAggregateInput
    _sum?: InquirySumOrderByAggregateInput
  }

  export type InquiryScalarWhereWithAggregatesInput = {
    AND?: InquiryScalarWhereWithAggregatesInput | InquiryScalarWhereWithAggregatesInput[]
    OR?: InquiryScalarWhereWithAggregatesInput[]
    NOT?: InquiryScalarWhereWithAggregatesInput | InquiryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Inquiry"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Inquiry"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Inquiry"> | Date | string
    status?: EnumInquiryStatusWithAggregatesFilter<"Inquiry"> | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeWithAggregatesFilter<"Inquiry"> | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelWithAggregatesFilter<"Inquiry"> | $Enums.UrgencyLevel
    classificationConfidence?: FloatWithAggregatesFilter<"Inquiry"> | number
    qualificationScore?: IntWithAggregatesFilter<"Inquiry"> | number
    preferredLanguage?: EnumLanguageCodeWithAggregatesFilter<"Inquiry"> | $Enums.LanguageCode
    clientType?: EnumClientTypeWithAggregatesFilter<"Inquiry"> | $Enums.ClientType
    contactName?: StringWithAggregatesFilter<"Inquiry"> | string
    organizationName?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    email?: StringWithAggregatesFilter<"Inquiry"> | string
    phone?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    title?: StringWithAggregatesFilter<"Inquiry"> | string
    description?: StringWithAggregatesFilter<"Inquiry"> | string
    nationality?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    currentStatus?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    documentCountry?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    targetAgency?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    dueDate?: DateTimeNullableWithAggregatesFilter<"Inquiry"> | Date | string | null
    assignee?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    internalMemo?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    wantsCallback?: BoolWithAggregatesFilter<"Inquiry"> | boolean
    consentToPrivacy?: BoolWithAggregatesFilter<"Inquiry"> | boolean
    intakeSource?: StringWithAggregatesFilter<"Inquiry"> | string
    generatedSummary?: StringWithAggregatesFilter<"Inquiry"> | string
    generatedGuidance?: StringWithAggregatesFilter<"Inquiry"> | string
    generatedReceiptMessage?: StringWithAggregatesFilter<"Inquiry"> | string
    classificationReason?: StringWithAggregatesFilter<"Inquiry"> | string
    recommendedNextStep?: StringWithAggregatesFilter<"Inquiry"> | string
    serviceTags?: StringWithAggregatesFilter<"Inquiry"> | string
  }

  export type ServiceTypeWhereInput = {
    AND?: ServiceTypeWhereInput | ServiceTypeWhereInput[]
    OR?: ServiceTypeWhereInput[]
    NOT?: ServiceTypeWhereInput | ServiceTypeWhereInput[]
    id?: StringFilter<"ServiceType"> | string
    legacyId?: StringFilter<"ServiceType"> | string
    name?: StringFilter<"ServiceType"> | string
    category?: StringFilter<"ServiceType"> | string
    minPrice?: IntFilter<"ServiceType"> | number
    maxPrice?: IntFilter<"ServiceType"> | number
    isAppeal?: BoolFilter<"ServiceType"> | boolean
    isActive?: BoolFilter<"ServiceType"> | boolean
    source?: StringFilter<"ServiceType"> | string
    createdAt?: DateTimeFilter<"ServiceType"> | Date | string
    updatedAt?: DateTimeFilter<"ServiceType"> | Date | string
    quoteLineItems?: QuoteLineItemListRelationFilter
  }

  export type ServiceTypeOrderByWithRelationInput = {
    id?: SortOrder
    legacyId?: SortOrder
    name?: SortOrder
    category?: SortOrder
    minPrice?: SortOrder
    maxPrice?: SortOrder
    isAppeal?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    quoteLineItems?: QuoteLineItemOrderByRelationAggregateInput
  }

  export type ServiceTypeWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    legacyId?: string
    AND?: ServiceTypeWhereInput | ServiceTypeWhereInput[]
    OR?: ServiceTypeWhereInput[]
    NOT?: ServiceTypeWhereInput | ServiceTypeWhereInput[]
    name?: StringFilter<"ServiceType"> | string
    category?: StringFilter<"ServiceType"> | string
    minPrice?: IntFilter<"ServiceType"> | number
    maxPrice?: IntFilter<"ServiceType"> | number
    isAppeal?: BoolFilter<"ServiceType"> | boolean
    isActive?: BoolFilter<"ServiceType"> | boolean
    source?: StringFilter<"ServiceType"> | string
    createdAt?: DateTimeFilter<"ServiceType"> | Date | string
    updatedAt?: DateTimeFilter<"ServiceType"> | Date | string
    quoteLineItems?: QuoteLineItemListRelationFilter
  }, "id" | "legacyId">

  export type ServiceTypeOrderByWithAggregationInput = {
    id?: SortOrder
    legacyId?: SortOrder
    name?: SortOrder
    category?: SortOrder
    minPrice?: SortOrder
    maxPrice?: SortOrder
    isAppeal?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ServiceTypeCountOrderByAggregateInput
    _avg?: ServiceTypeAvgOrderByAggregateInput
    _max?: ServiceTypeMaxOrderByAggregateInput
    _min?: ServiceTypeMinOrderByAggregateInput
    _sum?: ServiceTypeSumOrderByAggregateInput
  }

  export type ServiceTypeScalarWhereWithAggregatesInput = {
    AND?: ServiceTypeScalarWhereWithAggregatesInput | ServiceTypeScalarWhereWithAggregatesInput[]
    OR?: ServiceTypeScalarWhereWithAggregatesInput[]
    NOT?: ServiceTypeScalarWhereWithAggregatesInput | ServiceTypeScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ServiceType"> | string
    legacyId?: StringWithAggregatesFilter<"ServiceType"> | string
    name?: StringWithAggregatesFilter<"ServiceType"> | string
    category?: StringWithAggregatesFilter<"ServiceType"> | string
    minPrice?: IntWithAggregatesFilter<"ServiceType"> | number
    maxPrice?: IntWithAggregatesFilter<"ServiceType"> | number
    isAppeal?: BoolWithAggregatesFilter<"ServiceType"> | boolean
    isActive?: BoolWithAggregatesFilter<"ServiceType"> | boolean
    source?: StringWithAggregatesFilter<"ServiceType"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ServiceType"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ServiceType"> | Date | string
  }

  export type PricingOptionWhereInput = {
    AND?: PricingOptionWhereInput | PricingOptionWhereInput[]
    OR?: PricingOptionWhereInput[]
    NOT?: PricingOptionWhereInput | PricingOptionWhereInput[]
    id?: StringFilter<"PricingOption"> | string
    legacyId?: StringFilter<"PricingOption"> | string
    name?: StringFilter<"PricingOption"> | string
    description?: StringFilter<"PricingOption"> | string
    optionType?: EnumPricingOptionTypeFilter<"PricingOption"> | $Enums.PricingOptionType
    flatAmount?: IntNullableFilter<"PricingOption"> | number | null
    percentRate?: IntNullableFilter<"PricingOption"> | number | null
    unitLabel?: StringNullableFilter<"PricingOption"> | string | null
    isVat?: BoolFilter<"PricingOption"> | boolean
    isActive?: BoolFilter<"PricingOption"> | boolean
    source?: StringFilter<"PricingOption"> | string
    createdAt?: DateTimeFilter<"PricingOption"> | Date | string
    updatedAt?: DateTimeFilter<"PricingOption"> | Date | string
    quoteAdjustments?: QuoteAdjustmentListRelationFilter
  }

  export type PricingOptionOrderByWithRelationInput = {
    id?: SortOrder
    legacyId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    optionType?: SortOrder
    flatAmount?: SortOrderInput | SortOrder
    percentRate?: SortOrderInput | SortOrder
    unitLabel?: SortOrderInput | SortOrder
    isVat?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    quoteAdjustments?: QuoteAdjustmentOrderByRelationAggregateInput
  }

  export type PricingOptionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    legacyId?: string
    AND?: PricingOptionWhereInput | PricingOptionWhereInput[]
    OR?: PricingOptionWhereInput[]
    NOT?: PricingOptionWhereInput | PricingOptionWhereInput[]
    name?: StringFilter<"PricingOption"> | string
    description?: StringFilter<"PricingOption"> | string
    optionType?: EnumPricingOptionTypeFilter<"PricingOption"> | $Enums.PricingOptionType
    flatAmount?: IntNullableFilter<"PricingOption"> | number | null
    percentRate?: IntNullableFilter<"PricingOption"> | number | null
    unitLabel?: StringNullableFilter<"PricingOption"> | string | null
    isVat?: BoolFilter<"PricingOption"> | boolean
    isActive?: BoolFilter<"PricingOption"> | boolean
    source?: StringFilter<"PricingOption"> | string
    createdAt?: DateTimeFilter<"PricingOption"> | Date | string
    updatedAt?: DateTimeFilter<"PricingOption"> | Date | string
    quoteAdjustments?: QuoteAdjustmentListRelationFilter
  }, "id" | "legacyId">

  export type PricingOptionOrderByWithAggregationInput = {
    id?: SortOrder
    legacyId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    optionType?: SortOrder
    flatAmount?: SortOrderInput | SortOrder
    percentRate?: SortOrderInput | SortOrder
    unitLabel?: SortOrderInput | SortOrder
    isVat?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PricingOptionCountOrderByAggregateInput
    _avg?: PricingOptionAvgOrderByAggregateInput
    _max?: PricingOptionMaxOrderByAggregateInput
    _min?: PricingOptionMinOrderByAggregateInput
    _sum?: PricingOptionSumOrderByAggregateInput
  }

  export type PricingOptionScalarWhereWithAggregatesInput = {
    AND?: PricingOptionScalarWhereWithAggregatesInput | PricingOptionScalarWhereWithAggregatesInput[]
    OR?: PricingOptionScalarWhereWithAggregatesInput[]
    NOT?: PricingOptionScalarWhereWithAggregatesInput | PricingOptionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PricingOption"> | string
    legacyId?: StringWithAggregatesFilter<"PricingOption"> | string
    name?: StringWithAggregatesFilter<"PricingOption"> | string
    description?: StringWithAggregatesFilter<"PricingOption"> | string
    optionType?: EnumPricingOptionTypeWithAggregatesFilter<"PricingOption"> | $Enums.PricingOptionType
    flatAmount?: IntNullableWithAggregatesFilter<"PricingOption"> | number | null
    percentRate?: IntNullableWithAggregatesFilter<"PricingOption"> | number | null
    unitLabel?: StringNullableWithAggregatesFilter<"PricingOption"> | string | null
    isVat?: BoolWithAggregatesFilter<"PricingOption"> | boolean
    isActive?: BoolWithAggregatesFilter<"PricingOption"> | boolean
    source?: StringWithAggregatesFilter<"PricingOption"> | string
    createdAt?: DateTimeWithAggregatesFilter<"PricingOption"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PricingOption"> | Date | string
  }

  export type PricingRuleWhereInput = {
    AND?: PricingRuleWhereInput | PricingRuleWhereInput[]
    OR?: PricingRuleWhereInput[]
    NOT?: PricingRuleWhereInput | PricingRuleWhereInput[]
    id?: StringFilter<"PricingRule"> | string
    code?: StringFilter<"PricingRule"> | string
    ruleType?: EnumPricingRuleTypeFilter<"PricingRule"> | $Enums.PricingRuleType
    label?: StringFilter<"PricingRule"> | string
    description?: StringNullableFilter<"PricingRule"> | string | null
    numericValue?: IntNullableFilter<"PricingRule"> | number | null
    percentValue?: IntNullableFilter<"PricingRule"> | number | null
    jsonValue?: StringNullableFilter<"PricingRule"> | string | null
    isDefault?: BoolFilter<"PricingRule"> | boolean
    isActive?: BoolFilter<"PricingRule"> | boolean
    source?: StringFilter<"PricingRule"> | string
    createdAt?: DateTimeFilter<"PricingRule"> | Date | string
    updatedAt?: DateTimeFilter<"PricingRule"> | Date | string
  }

  export type PricingRuleOrderByWithRelationInput = {
    id?: SortOrder
    code?: SortOrder
    ruleType?: SortOrder
    label?: SortOrder
    description?: SortOrderInput | SortOrder
    numericValue?: SortOrderInput | SortOrder
    percentValue?: SortOrderInput | SortOrder
    jsonValue?: SortOrderInput | SortOrder
    isDefault?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingRuleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    code?: string
    AND?: PricingRuleWhereInput | PricingRuleWhereInput[]
    OR?: PricingRuleWhereInput[]
    NOT?: PricingRuleWhereInput | PricingRuleWhereInput[]
    ruleType?: EnumPricingRuleTypeFilter<"PricingRule"> | $Enums.PricingRuleType
    label?: StringFilter<"PricingRule"> | string
    description?: StringNullableFilter<"PricingRule"> | string | null
    numericValue?: IntNullableFilter<"PricingRule"> | number | null
    percentValue?: IntNullableFilter<"PricingRule"> | number | null
    jsonValue?: StringNullableFilter<"PricingRule"> | string | null
    isDefault?: BoolFilter<"PricingRule"> | boolean
    isActive?: BoolFilter<"PricingRule"> | boolean
    source?: StringFilter<"PricingRule"> | string
    createdAt?: DateTimeFilter<"PricingRule"> | Date | string
    updatedAt?: DateTimeFilter<"PricingRule"> | Date | string
  }, "id" | "code">

  export type PricingRuleOrderByWithAggregationInput = {
    id?: SortOrder
    code?: SortOrder
    ruleType?: SortOrder
    label?: SortOrder
    description?: SortOrderInput | SortOrder
    numericValue?: SortOrderInput | SortOrder
    percentValue?: SortOrderInput | SortOrder
    jsonValue?: SortOrderInput | SortOrder
    isDefault?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PricingRuleCountOrderByAggregateInput
    _avg?: PricingRuleAvgOrderByAggregateInput
    _max?: PricingRuleMaxOrderByAggregateInput
    _min?: PricingRuleMinOrderByAggregateInput
    _sum?: PricingRuleSumOrderByAggregateInput
  }

  export type PricingRuleScalarWhereWithAggregatesInput = {
    AND?: PricingRuleScalarWhereWithAggregatesInput | PricingRuleScalarWhereWithAggregatesInput[]
    OR?: PricingRuleScalarWhereWithAggregatesInput[]
    NOT?: PricingRuleScalarWhereWithAggregatesInput | PricingRuleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PricingRule"> | string
    code?: StringWithAggregatesFilter<"PricingRule"> | string
    ruleType?: EnumPricingRuleTypeWithAggregatesFilter<"PricingRule"> | $Enums.PricingRuleType
    label?: StringWithAggregatesFilter<"PricingRule"> | string
    description?: StringNullableWithAggregatesFilter<"PricingRule"> | string | null
    numericValue?: IntNullableWithAggregatesFilter<"PricingRule"> | number | null
    percentValue?: IntNullableWithAggregatesFilter<"PricingRule"> | number | null
    jsonValue?: StringNullableWithAggregatesFilter<"PricingRule"> | string | null
    isDefault?: BoolWithAggregatesFilter<"PricingRule"> | boolean
    isActive?: BoolWithAggregatesFilter<"PricingRule"> | boolean
    source?: StringWithAggregatesFilter<"PricingRule"> | string
    createdAt?: DateTimeWithAggregatesFilter<"PricingRule"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PricingRule"> | Date | string
  }

  export type QuoteWhereInput = {
    AND?: QuoteWhereInput | QuoteWhereInput[]
    OR?: QuoteWhereInput[]
    NOT?: QuoteWhereInput | QuoteWhereInput[]
    id?: StringFilter<"Quote"> | string
    inquiryId?: StringFilter<"Quote"> | string
    status?: EnumQuoteStatusFilter<"Quote"> | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFilter<"Quote"> | string
    selectedOptionLegacyIds?: StringFilter<"Quote"> | string
    urgencyRuleCode?: StringFilter<"Quote"> | string
    consultRuleCode?: StringFilter<"Quote"> | string
    paymentRuleCode?: StringFilter<"Quote"> | string
    rangeMode?: BoolFilter<"Quote"> | boolean
    serviceBaseMin?: IntFilter<"Quote"> | number
    serviceBaseMax?: IntFilter<"Quote"> | number
    subtotalMin?: IntFilter<"Quote"> | number
    subtotalMax?: IntFilter<"Quote"> | number
    vatAmountMin?: IntFilter<"Quote"> | number
    vatAmountMax?: IntFilter<"Quote"> | number
    totalMin?: IntFilter<"Quote"> | number
    totalMax?: IntFilter<"Quote"> | number
    consultFee?: IntFilter<"Quote"> | number
    successFeeRestricted?: BoolFilter<"Quote"> | boolean
    draftNotes?: StringNullableFilter<"Quote"> | string | null
    calculationSummary?: StringNullableFilter<"Quote"> | string | null
    createdAt?: DateTimeFilter<"Quote"> | Date | string
    updatedAt?: DateTimeFilter<"Quote"> | Date | string
    inquiry?: XOR<InquiryScalarRelationFilter, InquiryWhereInput>
    lineItems?: QuoteLineItemListRelationFilter
    adjustments?: QuoteAdjustmentListRelationFilter
    paymentPlans?: PaymentPlanListRelationFilter
    contractDraft?: XOR<ContractDraftNullableScalarRelationFilter, ContractDraftWhereInput> | null
  }

  export type QuoteOrderByWithRelationInput = {
    id?: SortOrder
    inquiryId?: SortOrder
    status?: SortOrder
    selectedServiceLegacyIds?: SortOrder
    selectedOptionLegacyIds?: SortOrder
    urgencyRuleCode?: SortOrder
    consultRuleCode?: SortOrder
    paymentRuleCode?: SortOrder
    rangeMode?: SortOrder
    serviceBaseMin?: SortOrder
    serviceBaseMax?: SortOrder
    subtotalMin?: SortOrder
    subtotalMax?: SortOrder
    vatAmountMin?: SortOrder
    vatAmountMax?: SortOrder
    totalMin?: SortOrder
    totalMax?: SortOrder
    consultFee?: SortOrder
    successFeeRestricted?: SortOrder
    draftNotes?: SortOrderInput | SortOrder
    calculationSummary?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    inquiry?: InquiryOrderByWithRelationInput
    lineItems?: QuoteLineItemOrderByRelationAggregateInput
    adjustments?: QuoteAdjustmentOrderByRelationAggregateInput
    paymentPlans?: PaymentPlanOrderByRelationAggregateInput
    contractDraft?: ContractDraftOrderByWithRelationInput
  }

  export type QuoteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QuoteWhereInput | QuoteWhereInput[]
    OR?: QuoteWhereInput[]
    NOT?: QuoteWhereInput | QuoteWhereInput[]
    inquiryId?: StringFilter<"Quote"> | string
    status?: EnumQuoteStatusFilter<"Quote"> | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFilter<"Quote"> | string
    selectedOptionLegacyIds?: StringFilter<"Quote"> | string
    urgencyRuleCode?: StringFilter<"Quote"> | string
    consultRuleCode?: StringFilter<"Quote"> | string
    paymentRuleCode?: StringFilter<"Quote"> | string
    rangeMode?: BoolFilter<"Quote"> | boolean
    serviceBaseMin?: IntFilter<"Quote"> | number
    serviceBaseMax?: IntFilter<"Quote"> | number
    subtotalMin?: IntFilter<"Quote"> | number
    subtotalMax?: IntFilter<"Quote"> | number
    vatAmountMin?: IntFilter<"Quote"> | number
    vatAmountMax?: IntFilter<"Quote"> | number
    totalMin?: IntFilter<"Quote"> | number
    totalMax?: IntFilter<"Quote"> | number
    consultFee?: IntFilter<"Quote"> | number
    successFeeRestricted?: BoolFilter<"Quote"> | boolean
    draftNotes?: StringNullableFilter<"Quote"> | string | null
    calculationSummary?: StringNullableFilter<"Quote"> | string | null
    createdAt?: DateTimeFilter<"Quote"> | Date | string
    updatedAt?: DateTimeFilter<"Quote"> | Date | string
    inquiry?: XOR<InquiryScalarRelationFilter, InquiryWhereInput>
    lineItems?: QuoteLineItemListRelationFilter
    adjustments?: QuoteAdjustmentListRelationFilter
    paymentPlans?: PaymentPlanListRelationFilter
    contractDraft?: XOR<ContractDraftNullableScalarRelationFilter, ContractDraftWhereInput> | null
  }, "id">

  export type QuoteOrderByWithAggregationInput = {
    id?: SortOrder
    inquiryId?: SortOrder
    status?: SortOrder
    selectedServiceLegacyIds?: SortOrder
    selectedOptionLegacyIds?: SortOrder
    urgencyRuleCode?: SortOrder
    consultRuleCode?: SortOrder
    paymentRuleCode?: SortOrder
    rangeMode?: SortOrder
    serviceBaseMin?: SortOrder
    serviceBaseMax?: SortOrder
    subtotalMin?: SortOrder
    subtotalMax?: SortOrder
    vatAmountMin?: SortOrder
    vatAmountMax?: SortOrder
    totalMin?: SortOrder
    totalMax?: SortOrder
    consultFee?: SortOrder
    successFeeRestricted?: SortOrder
    draftNotes?: SortOrderInput | SortOrder
    calculationSummary?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: QuoteCountOrderByAggregateInput
    _avg?: QuoteAvgOrderByAggregateInput
    _max?: QuoteMaxOrderByAggregateInput
    _min?: QuoteMinOrderByAggregateInput
    _sum?: QuoteSumOrderByAggregateInput
  }

  export type QuoteScalarWhereWithAggregatesInput = {
    AND?: QuoteScalarWhereWithAggregatesInput | QuoteScalarWhereWithAggregatesInput[]
    OR?: QuoteScalarWhereWithAggregatesInput[]
    NOT?: QuoteScalarWhereWithAggregatesInput | QuoteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Quote"> | string
    inquiryId?: StringWithAggregatesFilter<"Quote"> | string
    status?: EnumQuoteStatusWithAggregatesFilter<"Quote"> | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringWithAggregatesFilter<"Quote"> | string
    selectedOptionLegacyIds?: StringWithAggregatesFilter<"Quote"> | string
    urgencyRuleCode?: StringWithAggregatesFilter<"Quote"> | string
    consultRuleCode?: StringWithAggregatesFilter<"Quote"> | string
    paymentRuleCode?: StringWithAggregatesFilter<"Quote"> | string
    rangeMode?: BoolWithAggregatesFilter<"Quote"> | boolean
    serviceBaseMin?: IntWithAggregatesFilter<"Quote"> | number
    serviceBaseMax?: IntWithAggregatesFilter<"Quote"> | number
    subtotalMin?: IntWithAggregatesFilter<"Quote"> | number
    subtotalMax?: IntWithAggregatesFilter<"Quote"> | number
    vatAmountMin?: IntWithAggregatesFilter<"Quote"> | number
    vatAmountMax?: IntWithAggregatesFilter<"Quote"> | number
    totalMin?: IntWithAggregatesFilter<"Quote"> | number
    totalMax?: IntWithAggregatesFilter<"Quote"> | number
    consultFee?: IntWithAggregatesFilter<"Quote"> | number
    successFeeRestricted?: BoolWithAggregatesFilter<"Quote"> | boolean
    draftNotes?: StringNullableWithAggregatesFilter<"Quote"> | string | null
    calculationSummary?: StringNullableWithAggregatesFilter<"Quote"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Quote"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Quote"> | Date | string
  }

  export type QuoteLineItemWhereInput = {
    AND?: QuoteLineItemWhereInput | QuoteLineItemWhereInput[]
    OR?: QuoteLineItemWhereInput[]
    NOT?: QuoteLineItemWhereInput | QuoteLineItemWhereInput[]
    id?: StringFilter<"QuoteLineItem"> | string
    quoteId?: StringFilter<"QuoteLineItem"> | string
    serviceTypeId?: StringNullableFilter<"QuoteLineItem"> | string | null
    kind?: EnumQuoteLineKindFilter<"QuoteLineItem"> | $Enums.QuoteLineKind
    label?: StringFilter<"QuoteLineItem"> | string
    description?: StringNullableFilter<"QuoteLineItem"> | string | null
    amountMin?: IntFilter<"QuoteLineItem"> | number
    amountMax?: IntFilter<"QuoteLineItem"> | number
    sortOrder?: IntFilter<"QuoteLineItem"> | number
    isManual?: BoolFilter<"QuoteLineItem"> | boolean
    createdAt?: DateTimeFilter<"QuoteLineItem"> | Date | string
    updatedAt?: DateTimeFilter<"QuoteLineItem"> | Date | string
    quote?: XOR<QuoteScalarRelationFilter, QuoteWhereInput>
    serviceType?: XOR<ServiceTypeNullableScalarRelationFilter, ServiceTypeWhereInput> | null
  }

  export type QuoteLineItemOrderByWithRelationInput = {
    id?: SortOrder
    quoteId?: SortOrder
    serviceTypeId?: SortOrderInput | SortOrder
    kind?: SortOrder
    label?: SortOrder
    description?: SortOrderInput | SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
    isManual?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    quote?: QuoteOrderByWithRelationInput
    serviceType?: ServiceTypeOrderByWithRelationInput
  }

  export type QuoteLineItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QuoteLineItemWhereInput | QuoteLineItemWhereInput[]
    OR?: QuoteLineItemWhereInput[]
    NOT?: QuoteLineItemWhereInput | QuoteLineItemWhereInput[]
    quoteId?: StringFilter<"QuoteLineItem"> | string
    serviceTypeId?: StringNullableFilter<"QuoteLineItem"> | string | null
    kind?: EnumQuoteLineKindFilter<"QuoteLineItem"> | $Enums.QuoteLineKind
    label?: StringFilter<"QuoteLineItem"> | string
    description?: StringNullableFilter<"QuoteLineItem"> | string | null
    amountMin?: IntFilter<"QuoteLineItem"> | number
    amountMax?: IntFilter<"QuoteLineItem"> | number
    sortOrder?: IntFilter<"QuoteLineItem"> | number
    isManual?: BoolFilter<"QuoteLineItem"> | boolean
    createdAt?: DateTimeFilter<"QuoteLineItem"> | Date | string
    updatedAt?: DateTimeFilter<"QuoteLineItem"> | Date | string
    quote?: XOR<QuoteScalarRelationFilter, QuoteWhereInput>
    serviceType?: XOR<ServiceTypeNullableScalarRelationFilter, ServiceTypeWhereInput> | null
  }, "id">

  export type QuoteLineItemOrderByWithAggregationInput = {
    id?: SortOrder
    quoteId?: SortOrder
    serviceTypeId?: SortOrderInput | SortOrder
    kind?: SortOrder
    label?: SortOrder
    description?: SortOrderInput | SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
    isManual?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: QuoteLineItemCountOrderByAggregateInput
    _avg?: QuoteLineItemAvgOrderByAggregateInput
    _max?: QuoteLineItemMaxOrderByAggregateInput
    _min?: QuoteLineItemMinOrderByAggregateInput
    _sum?: QuoteLineItemSumOrderByAggregateInput
  }

  export type QuoteLineItemScalarWhereWithAggregatesInput = {
    AND?: QuoteLineItemScalarWhereWithAggregatesInput | QuoteLineItemScalarWhereWithAggregatesInput[]
    OR?: QuoteLineItemScalarWhereWithAggregatesInput[]
    NOT?: QuoteLineItemScalarWhereWithAggregatesInput | QuoteLineItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuoteLineItem"> | string
    quoteId?: StringWithAggregatesFilter<"QuoteLineItem"> | string
    serviceTypeId?: StringNullableWithAggregatesFilter<"QuoteLineItem"> | string | null
    kind?: EnumQuoteLineKindWithAggregatesFilter<"QuoteLineItem"> | $Enums.QuoteLineKind
    label?: StringWithAggregatesFilter<"QuoteLineItem"> | string
    description?: StringNullableWithAggregatesFilter<"QuoteLineItem"> | string | null
    amountMin?: IntWithAggregatesFilter<"QuoteLineItem"> | number
    amountMax?: IntWithAggregatesFilter<"QuoteLineItem"> | number
    sortOrder?: IntWithAggregatesFilter<"QuoteLineItem"> | number
    isManual?: BoolWithAggregatesFilter<"QuoteLineItem"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"QuoteLineItem"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"QuoteLineItem"> | Date | string
  }

  export type QuoteAdjustmentWhereInput = {
    AND?: QuoteAdjustmentWhereInput | QuoteAdjustmentWhereInput[]
    OR?: QuoteAdjustmentWhereInput[]
    NOT?: QuoteAdjustmentWhereInput | QuoteAdjustmentWhereInput[]
    id?: StringFilter<"QuoteAdjustment"> | string
    quoteId?: StringFilter<"QuoteAdjustment"> | string
    pricingOptionId?: StringNullableFilter<"QuoteAdjustment"> | string | null
    label?: StringFilter<"QuoteAdjustment"> | string
    description?: StringNullableFilter<"QuoteAdjustment"> | string | null
    optionType?: EnumPricingOptionTypeFilter<"QuoteAdjustment"> | $Enums.PricingOptionType
    flatAmount?: IntNullableFilter<"QuoteAdjustment"> | number | null
    percentRate?: IntNullableFilter<"QuoteAdjustment"> | number | null
    computedMin?: IntFilter<"QuoteAdjustment"> | number
    computedMax?: IntFilter<"QuoteAdjustment"> | number
    isVat?: BoolFilter<"QuoteAdjustment"> | boolean
    sortOrder?: IntFilter<"QuoteAdjustment"> | number
    isManual?: BoolFilter<"QuoteAdjustment"> | boolean
    createdAt?: DateTimeFilter<"QuoteAdjustment"> | Date | string
    updatedAt?: DateTimeFilter<"QuoteAdjustment"> | Date | string
    quote?: XOR<QuoteScalarRelationFilter, QuoteWhereInput>
    pricingOption?: XOR<PricingOptionNullableScalarRelationFilter, PricingOptionWhereInput> | null
  }

  export type QuoteAdjustmentOrderByWithRelationInput = {
    id?: SortOrder
    quoteId?: SortOrder
    pricingOptionId?: SortOrderInput | SortOrder
    label?: SortOrder
    description?: SortOrderInput | SortOrder
    optionType?: SortOrder
    flatAmount?: SortOrderInput | SortOrder
    percentRate?: SortOrderInput | SortOrder
    computedMin?: SortOrder
    computedMax?: SortOrder
    isVat?: SortOrder
    sortOrder?: SortOrder
    isManual?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    quote?: QuoteOrderByWithRelationInput
    pricingOption?: PricingOptionOrderByWithRelationInput
  }

  export type QuoteAdjustmentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: QuoteAdjustmentWhereInput | QuoteAdjustmentWhereInput[]
    OR?: QuoteAdjustmentWhereInput[]
    NOT?: QuoteAdjustmentWhereInput | QuoteAdjustmentWhereInput[]
    quoteId?: StringFilter<"QuoteAdjustment"> | string
    pricingOptionId?: StringNullableFilter<"QuoteAdjustment"> | string | null
    label?: StringFilter<"QuoteAdjustment"> | string
    description?: StringNullableFilter<"QuoteAdjustment"> | string | null
    optionType?: EnumPricingOptionTypeFilter<"QuoteAdjustment"> | $Enums.PricingOptionType
    flatAmount?: IntNullableFilter<"QuoteAdjustment"> | number | null
    percentRate?: IntNullableFilter<"QuoteAdjustment"> | number | null
    computedMin?: IntFilter<"QuoteAdjustment"> | number
    computedMax?: IntFilter<"QuoteAdjustment"> | number
    isVat?: BoolFilter<"QuoteAdjustment"> | boolean
    sortOrder?: IntFilter<"QuoteAdjustment"> | number
    isManual?: BoolFilter<"QuoteAdjustment"> | boolean
    createdAt?: DateTimeFilter<"QuoteAdjustment"> | Date | string
    updatedAt?: DateTimeFilter<"QuoteAdjustment"> | Date | string
    quote?: XOR<QuoteScalarRelationFilter, QuoteWhereInput>
    pricingOption?: XOR<PricingOptionNullableScalarRelationFilter, PricingOptionWhereInput> | null
  }, "id">

  export type QuoteAdjustmentOrderByWithAggregationInput = {
    id?: SortOrder
    quoteId?: SortOrder
    pricingOptionId?: SortOrderInput | SortOrder
    label?: SortOrder
    description?: SortOrderInput | SortOrder
    optionType?: SortOrder
    flatAmount?: SortOrderInput | SortOrder
    percentRate?: SortOrderInput | SortOrder
    computedMin?: SortOrder
    computedMax?: SortOrder
    isVat?: SortOrder
    sortOrder?: SortOrder
    isManual?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: QuoteAdjustmentCountOrderByAggregateInput
    _avg?: QuoteAdjustmentAvgOrderByAggregateInput
    _max?: QuoteAdjustmentMaxOrderByAggregateInput
    _min?: QuoteAdjustmentMinOrderByAggregateInput
    _sum?: QuoteAdjustmentSumOrderByAggregateInput
  }

  export type QuoteAdjustmentScalarWhereWithAggregatesInput = {
    AND?: QuoteAdjustmentScalarWhereWithAggregatesInput | QuoteAdjustmentScalarWhereWithAggregatesInput[]
    OR?: QuoteAdjustmentScalarWhereWithAggregatesInput[]
    NOT?: QuoteAdjustmentScalarWhereWithAggregatesInput | QuoteAdjustmentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"QuoteAdjustment"> | string
    quoteId?: StringWithAggregatesFilter<"QuoteAdjustment"> | string
    pricingOptionId?: StringNullableWithAggregatesFilter<"QuoteAdjustment"> | string | null
    label?: StringWithAggregatesFilter<"QuoteAdjustment"> | string
    description?: StringNullableWithAggregatesFilter<"QuoteAdjustment"> | string | null
    optionType?: EnumPricingOptionTypeWithAggregatesFilter<"QuoteAdjustment"> | $Enums.PricingOptionType
    flatAmount?: IntNullableWithAggregatesFilter<"QuoteAdjustment"> | number | null
    percentRate?: IntNullableWithAggregatesFilter<"QuoteAdjustment"> | number | null
    computedMin?: IntWithAggregatesFilter<"QuoteAdjustment"> | number
    computedMax?: IntWithAggregatesFilter<"QuoteAdjustment"> | number
    isVat?: BoolWithAggregatesFilter<"QuoteAdjustment"> | boolean
    sortOrder?: IntWithAggregatesFilter<"QuoteAdjustment"> | number
    isManual?: BoolWithAggregatesFilter<"QuoteAdjustment"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"QuoteAdjustment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"QuoteAdjustment"> | Date | string
  }

  export type PaymentPlanWhereInput = {
    AND?: PaymentPlanWhereInput | PaymentPlanWhereInput[]
    OR?: PaymentPlanWhereInput[]
    NOT?: PaymentPlanWhereInput | PaymentPlanWhereInput[]
    id?: StringFilter<"PaymentPlan"> | string
    quoteId?: StringFilter<"PaymentPlan"> | string
    stageKind?: EnumPaymentStageKindFilter<"PaymentPlan"> | $Enums.PaymentStageKind
    percentage?: IntFilter<"PaymentPlan"> | number
    dueText?: StringFilter<"PaymentPlan"> | string
    amountMin?: IntFilter<"PaymentPlan"> | number
    amountMax?: IntFilter<"PaymentPlan"> | number
    sortOrder?: IntFilter<"PaymentPlan"> | number
    createdAt?: DateTimeFilter<"PaymentPlan"> | Date | string
    updatedAt?: DateTimeFilter<"PaymentPlan"> | Date | string
    quote?: XOR<QuoteScalarRelationFilter, QuoteWhereInput>
  }

  export type PaymentPlanOrderByWithRelationInput = {
    id?: SortOrder
    quoteId?: SortOrder
    stageKind?: SortOrder
    percentage?: SortOrder
    dueText?: SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    quote?: QuoteOrderByWithRelationInput
  }

  export type PaymentPlanWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PaymentPlanWhereInput | PaymentPlanWhereInput[]
    OR?: PaymentPlanWhereInput[]
    NOT?: PaymentPlanWhereInput | PaymentPlanWhereInput[]
    quoteId?: StringFilter<"PaymentPlan"> | string
    stageKind?: EnumPaymentStageKindFilter<"PaymentPlan"> | $Enums.PaymentStageKind
    percentage?: IntFilter<"PaymentPlan"> | number
    dueText?: StringFilter<"PaymentPlan"> | string
    amountMin?: IntFilter<"PaymentPlan"> | number
    amountMax?: IntFilter<"PaymentPlan"> | number
    sortOrder?: IntFilter<"PaymentPlan"> | number
    createdAt?: DateTimeFilter<"PaymentPlan"> | Date | string
    updatedAt?: DateTimeFilter<"PaymentPlan"> | Date | string
    quote?: XOR<QuoteScalarRelationFilter, QuoteWhereInput>
  }, "id">

  export type PaymentPlanOrderByWithAggregationInput = {
    id?: SortOrder
    quoteId?: SortOrder
    stageKind?: SortOrder
    percentage?: SortOrder
    dueText?: SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PaymentPlanCountOrderByAggregateInput
    _avg?: PaymentPlanAvgOrderByAggregateInput
    _max?: PaymentPlanMaxOrderByAggregateInput
    _min?: PaymentPlanMinOrderByAggregateInput
    _sum?: PaymentPlanSumOrderByAggregateInput
  }

  export type PaymentPlanScalarWhereWithAggregatesInput = {
    AND?: PaymentPlanScalarWhereWithAggregatesInput | PaymentPlanScalarWhereWithAggregatesInput[]
    OR?: PaymentPlanScalarWhereWithAggregatesInput[]
    NOT?: PaymentPlanScalarWhereWithAggregatesInput | PaymentPlanScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PaymentPlan"> | string
    quoteId?: StringWithAggregatesFilter<"PaymentPlan"> | string
    stageKind?: EnumPaymentStageKindWithAggregatesFilter<"PaymentPlan"> | $Enums.PaymentStageKind
    percentage?: IntWithAggregatesFilter<"PaymentPlan"> | number
    dueText?: StringWithAggregatesFilter<"PaymentPlan"> | string
    amountMin?: IntWithAggregatesFilter<"PaymentPlan"> | number
    amountMax?: IntWithAggregatesFilter<"PaymentPlan"> | number
    sortOrder?: IntWithAggregatesFilter<"PaymentPlan"> | number
    createdAt?: DateTimeWithAggregatesFilter<"PaymentPlan"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PaymentPlan"> | Date | string
  }

  export type ContractDraftWhereInput = {
    AND?: ContractDraftWhereInput | ContractDraftWhereInput[]
    OR?: ContractDraftWhereInput[]
    NOT?: ContractDraftWhereInput | ContractDraftWhereInput[]
    id?: StringFilter<"ContractDraft"> | string
    inquiryId?: StringFilter<"ContractDraft"> | string
    quoteId?: StringFilter<"ContractDraft"> | string
    status?: EnumContractDraftStatusFilter<"ContractDraft"> | $Enums.ContractDraftStatus
    title?: StringFilter<"ContractDraft"> | string
    bodyText?: StringFilter<"ContractDraft"> | string
    scopeText?: StringNullableFilter<"ContractDraft"> | string | null
    paymentSummary?: StringNullableFilter<"ContractDraft"> | string | null
    successFeeRestricted?: BoolFilter<"ContractDraft"> | boolean
    specialTerms?: StringNullableFilter<"ContractDraft"> | string | null
    createdAt?: DateTimeFilter<"ContractDraft"> | Date | string
    updatedAt?: DateTimeFilter<"ContractDraft"> | Date | string
    inquiry?: XOR<InquiryScalarRelationFilter, InquiryWhereInput>
    quote?: XOR<QuoteScalarRelationFilter, QuoteWhereInput>
  }

  export type ContractDraftOrderByWithRelationInput = {
    id?: SortOrder
    inquiryId?: SortOrder
    quoteId?: SortOrder
    status?: SortOrder
    title?: SortOrder
    bodyText?: SortOrder
    scopeText?: SortOrderInput | SortOrder
    paymentSummary?: SortOrderInput | SortOrder
    successFeeRestricted?: SortOrder
    specialTerms?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    inquiry?: InquiryOrderByWithRelationInput
    quote?: QuoteOrderByWithRelationInput
  }

  export type ContractDraftWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    quoteId?: string
    AND?: ContractDraftWhereInput | ContractDraftWhereInput[]
    OR?: ContractDraftWhereInput[]
    NOT?: ContractDraftWhereInput | ContractDraftWhereInput[]
    inquiryId?: StringFilter<"ContractDraft"> | string
    status?: EnumContractDraftStatusFilter<"ContractDraft"> | $Enums.ContractDraftStatus
    title?: StringFilter<"ContractDraft"> | string
    bodyText?: StringFilter<"ContractDraft"> | string
    scopeText?: StringNullableFilter<"ContractDraft"> | string | null
    paymentSummary?: StringNullableFilter<"ContractDraft"> | string | null
    successFeeRestricted?: BoolFilter<"ContractDraft"> | boolean
    specialTerms?: StringNullableFilter<"ContractDraft"> | string | null
    createdAt?: DateTimeFilter<"ContractDraft"> | Date | string
    updatedAt?: DateTimeFilter<"ContractDraft"> | Date | string
    inquiry?: XOR<InquiryScalarRelationFilter, InquiryWhereInput>
    quote?: XOR<QuoteScalarRelationFilter, QuoteWhereInput>
  }, "id" | "quoteId">

  export type ContractDraftOrderByWithAggregationInput = {
    id?: SortOrder
    inquiryId?: SortOrder
    quoteId?: SortOrder
    status?: SortOrder
    title?: SortOrder
    bodyText?: SortOrder
    scopeText?: SortOrderInput | SortOrder
    paymentSummary?: SortOrderInput | SortOrder
    successFeeRestricted?: SortOrder
    specialTerms?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ContractDraftCountOrderByAggregateInput
    _max?: ContractDraftMaxOrderByAggregateInput
    _min?: ContractDraftMinOrderByAggregateInput
  }

  export type ContractDraftScalarWhereWithAggregatesInput = {
    AND?: ContractDraftScalarWhereWithAggregatesInput | ContractDraftScalarWhereWithAggregatesInput[]
    OR?: ContractDraftScalarWhereWithAggregatesInput[]
    NOT?: ContractDraftScalarWhereWithAggregatesInput | ContractDraftScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ContractDraft"> | string
    inquiryId?: StringWithAggregatesFilter<"ContractDraft"> | string
    quoteId?: StringWithAggregatesFilter<"ContractDraft"> | string
    status?: EnumContractDraftStatusWithAggregatesFilter<"ContractDraft"> | $Enums.ContractDraftStatus
    title?: StringWithAggregatesFilter<"ContractDraft"> | string
    bodyText?: StringWithAggregatesFilter<"ContractDraft"> | string
    scopeText?: StringNullableWithAggregatesFilter<"ContractDraft"> | string | null
    paymentSummary?: StringNullableWithAggregatesFilter<"ContractDraft"> | string | null
    successFeeRestricted?: BoolWithAggregatesFilter<"ContractDraft"> | boolean
    specialTerms?: StringNullableWithAggregatesFilter<"ContractDraft"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ContractDraft"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ContractDraft"> | Date | string
  }

  export type LegacyImportLogWhereInput = {
    AND?: LegacyImportLogWhereInput | LegacyImportLogWhereInput[]
    OR?: LegacyImportLogWhereInput[]
    NOT?: LegacyImportLogWhereInput | LegacyImportLogWhereInput[]
    id?: StringFilter<"LegacyImportLog"> | string
    source?: StringFilter<"LegacyImportLog"> | string
    version?: StringFilter<"LegacyImportLog"> | string
    payloadJson?: StringNullableFilter<"LegacyImportLog"> | string | null
    importedAt?: DateTimeFilter<"LegacyImportLog"> | Date | string
    createdCount?: IntFilter<"LegacyImportLog"> | number
  }

  export type LegacyImportLogOrderByWithRelationInput = {
    id?: SortOrder
    source?: SortOrder
    version?: SortOrder
    payloadJson?: SortOrderInput | SortOrder
    importedAt?: SortOrder
    createdCount?: SortOrder
  }

  export type LegacyImportLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LegacyImportLogWhereInput | LegacyImportLogWhereInput[]
    OR?: LegacyImportLogWhereInput[]
    NOT?: LegacyImportLogWhereInput | LegacyImportLogWhereInput[]
    source?: StringFilter<"LegacyImportLog"> | string
    version?: StringFilter<"LegacyImportLog"> | string
    payloadJson?: StringNullableFilter<"LegacyImportLog"> | string | null
    importedAt?: DateTimeFilter<"LegacyImportLog"> | Date | string
    createdCount?: IntFilter<"LegacyImportLog"> | number
  }, "id">

  export type LegacyImportLogOrderByWithAggregationInput = {
    id?: SortOrder
    source?: SortOrder
    version?: SortOrder
    payloadJson?: SortOrderInput | SortOrder
    importedAt?: SortOrder
    createdCount?: SortOrder
    _count?: LegacyImportLogCountOrderByAggregateInput
    _avg?: LegacyImportLogAvgOrderByAggregateInput
    _max?: LegacyImportLogMaxOrderByAggregateInput
    _min?: LegacyImportLogMinOrderByAggregateInput
    _sum?: LegacyImportLogSumOrderByAggregateInput
  }

  export type LegacyImportLogScalarWhereWithAggregatesInput = {
    AND?: LegacyImportLogScalarWhereWithAggregatesInput | LegacyImportLogScalarWhereWithAggregatesInput[]
    OR?: LegacyImportLogScalarWhereWithAggregatesInput[]
    NOT?: LegacyImportLogScalarWhereWithAggregatesInput | LegacyImportLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LegacyImportLog"> | string
    source?: StringWithAggregatesFilter<"LegacyImportLog"> | string
    version?: StringWithAggregatesFilter<"LegacyImportLog"> | string
    payloadJson?: StringNullableWithAggregatesFilter<"LegacyImportLog"> | string | null
    importedAt?: DateTimeWithAggregatesFilter<"LegacyImportLog"> | Date | string
    createdCount?: IntWithAggregatesFilter<"LegacyImportLog"> | number
  }

  export type InquiryCreateInput = {
    id?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    status?: $Enums.InquiryStatus
    inquiryType?: $Enums.InquiryType
    urgencyLevel?: $Enums.UrgencyLevel
    classificationConfidence?: number
    qualificationScore?: number
    preferredLanguage?: $Enums.LanguageCode
    clientType?: $Enums.ClientType
    contactName: string
    organizationName?: string | null
    email: string
    phone?: string | null
    title: string
    description: string
    nationality?: string | null
    currentStatus?: string | null
    documentCountry?: string | null
    targetAgency?: string | null
    dueDate?: Date | string | null
    assignee?: string | null
    internalMemo?: string | null
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: string
    generatedSummary: string
    generatedGuidance: string
    generatedReceiptMessage: string
    classificationReason: string
    recommendedNextStep: string
    serviceTags?: string
    quotes?: QuoteCreateNestedManyWithoutInquiryInput
    contractDrafts?: ContractDraftCreateNestedManyWithoutInquiryInput
  }

  export type InquiryUncheckedCreateInput = {
    id?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    status?: $Enums.InquiryStatus
    inquiryType?: $Enums.InquiryType
    urgencyLevel?: $Enums.UrgencyLevel
    classificationConfidence?: number
    qualificationScore?: number
    preferredLanguage?: $Enums.LanguageCode
    clientType?: $Enums.ClientType
    contactName: string
    organizationName?: string | null
    email: string
    phone?: string | null
    title: string
    description: string
    nationality?: string | null
    currentStatus?: string | null
    documentCountry?: string | null
    targetAgency?: string | null
    dueDate?: Date | string | null
    assignee?: string | null
    internalMemo?: string | null
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: string
    generatedSummary: string
    generatedGuidance: string
    generatedReceiptMessage: string
    classificationReason: string
    recommendedNextStep: string
    serviceTags?: string
    quotes?: QuoteUncheckedCreateNestedManyWithoutInquiryInput
    contractDrafts?: ContractDraftUncheckedCreateNestedManyWithoutInquiryInput
  }

  export type InquiryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumInquiryStatusFieldUpdateOperationsInput | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeFieldUpdateOperationsInput | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelFieldUpdateOperationsInput | $Enums.UrgencyLevel
    classificationConfidence?: FloatFieldUpdateOperationsInput | number
    qualificationScore?: IntFieldUpdateOperationsInput | number
    preferredLanguage?: EnumLanguageCodeFieldUpdateOperationsInput | $Enums.LanguageCode
    clientType?: EnumClientTypeFieldUpdateOperationsInput | $Enums.ClientType
    contactName?: StringFieldUpdateOperationsInput | string
    organizationName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    nationality?: NullableStringFieldUpdateOperationsInput | string | null
    currentStatus?: NullableStringFieldUpdateOperationsInput | string | null
    documentCountry?: NullableStringFieldUpdateOperationsInput | string | null
    targetAgency?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignee?: NullableStringFieldUpdateOperationsInput | string | null
    internalMemo?: NullableStringFieldUpdateOperationsInput | string | null
    wantsCallback?: BoolFieldUpdateOperationsInput | boolean
    consentToPrivacy?: BoolFieldUpdateOperationsInput | boolean
    intakeSource?: StringFieldUpdateOperationsInput | string
    generatedSummary?: StringFieldUpdateOperationsInput | string
    generatedGuidance?: StringFieldUpdateOperationsInput | string
    generatedReceiptMessage?: StringFieldUpdateOperationsInput | string
    classificationReason?: StringFieldUpdateOperationsInput | string
    recommendedNextStep?: StringFieldUpdateOperationsInput | string
    serviceTags?: StringFieldUpdateOperationsInput | string
    quotes?: QuoteUpdateManyWithoutInquiryNestedInput
    contractDrafts?: ContractDraftUpdateManyWithoutInquiryNestedInput
  }

  export type InquiryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumInquiryStatusFieldUpdateOperationsInput | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeFieldUpdateOperationsInput | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelFieldUpdateOperationsInput | $Enums.UrgencyLevel
    classificationConfidence?: FloatFieldUpdateOperationsInput | number
    qualificationScore?: IntFieldUpdateOperationsInput | number
    preferredLanguage?: EnumLanguageCodeFieldUpdateOperationsInput | $Enums.LanguageCode
    clientType?: EnumClientTypeFieldUpdateOperationsInput | $Enums.ClientType
    contactName?: StringFieldUpdateOperationsInput | string
    organizationName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    nationality?: NullableStringFieldUpdateOperationsInput | string | null
    currentStatus?: NullableStringFieldUpdateOperationsInput | string | null
    documentCountry?: NullableStringFieldUpdateOperationsInput | string | null
    targetAgency?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignee?: NullableStringFieldUpdateOperationsInput | string | null
    internalMemo?: NullableStringFieldUpdateOperationsInput | string | null
    wantsCallback?: BoolFieldUpdateOperationsInput | boolean
    consentToPrivacy?: BoolFieldUpdateOperationsInput | boolean
    intakeSource?: StringFieldUpdateOperationsInput | string
    generatedSummary?: StringFieldUpdateOperationsInput | string
    generatedGuidance?: StringFieldUpdateOperationsInput | string
    generatedReceiptMessage?: StringFieldUpdateOperationsInput | string
    classificationReason?: StringFieldUpdateOperationsInput | string
    recommendedNextStep?: StringFieldUpdateOperationsInput | string
    serviceTags?: StringFieldUpdateOperationsInput | string
    quotes?: QuoteUncheckedUpdateManyWithoutInquiryNestedInput
    contractDrafts?: ContractDraftUncheckedUpdateManyWithoutInquiryNestedInput
  }

  export type InquiryCreateManyInput = {
    id?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    status?: $Enums.InquiryStatus
    inquiryType?: $Enums.InquiryType
    urgencyLevel?: $Enums.UrgencyLevel
    classificationConfidence?: number
    qualificationScore?: number
    preferredLanguage?: $Enums.LanguageCode
    clientType?: $Enums.ClientType
    contactName: string
    organizationName?: string | null
    email: string
    phone?: string | null
    title: string
    description: string
    nationality?: string | null
    currentStatus?: string | null
    documentCountry?: string | null
    targetAgency?: string | null
    dueDate?: Date | string | null
    assignee?: string | null
    internalMemo?: string | null
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: string
    generatedSummary: string
    generatedGuidance: string
    generatedReceiptMessage: string
    classificationReason: string
    recommendedNextStep: string
    serviceTags?: string
  }

  export type InquiryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumInquiryStatusFieldUpdateOperationsInput | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeFieldUpdateOperationsInput | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelFieldUpdateOperationsInput | $Enums.UrgencyLevel
    classificationConfidence?: FloatFieldUpdateOperationsInput | number
    qualificationScore?: IntFieldUpdateOperationsInput | number
    preferredLanguage?: EnumLanguageCodeFieldUpdateOperationsInput | $Enums.LanguageCode
    clientType?: EnumClientTypeFieldUpdateOperationsInput | $Enums.ClientType
    contactName?: StringFieldUpdateOperationsInput | string
    organizationName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    nationality?: NullableStringFieldUpdateOperationsInput | string | null
    currentStatus?: NullableStringFieldUpdateOperationsInput | string | null
    documentCountry?: NullableStringFieldUpdateOperationsInput | string | null
    targetAgency?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignee?: NullableStringFieldUpdateOperationsInput | string | null
    internalMemo?: NullableStringFieldUpdateOperationsInput | string | null
    wantsCallback?: BoolFieldUpdateOperationsInput | boolean
    consentToPrivacy?: BoolFieldUpdateOperationsInput | boolean
    intakeSource?: StringFieldUpdateOperationsInput | string
    generatedSummary?: StringFieldUpdateOperationsInput | string
    generatedGuidance?: StringFieldUpdateOperationsInput | string
    generatedReceiptMessage?: StringFieldUpdateOperationsInput | string
    classificationReason?: StringFieldUpdateOperationsInput | string
    recommendedNextStep?: StringFieldUpdateOperationsInput | string
    serviceTags?: StringFieldUpdateOperationsInput | string
  }

  export type InquiryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumInquiryStatusFieldUpdateOperationsInput | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeFieldUpdateOperationsInput | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelFieldUpdateOperationsInput | $Enums.UrgencyLevel
    classificationConfidence?: FloatFieldUpdateOperationsInput | number
    qualificationScore?: IntFieldUpdateOperationsInput | number
    preferredLanguage?: EnumLanguageCodeFieldUpdateOperationsInput | $Enums.LanguageCode
    clientType?: EnumClientTypeFieldUpdateOperationsInput | $Enums.ClientType
    contactName?: StringFieldUpdateOperationsInput | string
    organizationName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    nationality?: NullableStringFieldUpdateOperationsInput | string | null
    currentStatus?: NullableStringFieldUpdateOperationsInput | string | null
    documentCountry?: NullableStringFieldUpdateOperationsInput | string | null
    targetAgency?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignee?: NullableStringFieldUpdateOperationsInput | string | null
    internalMemo?: NullableStringFieldUpdateOperationsInput | string | null
    wantsCallback?: BoolFieldUpdateOperationsInput | boolean
    consentToPrivacy?: BoolFieldUpdateOperationsInput | boolean
    intakeSource?: StringFieldUpdateOperationsInput | string
    generatedSummary?: StringFieldUpdateOperationsInput | string
    generatedGuidance?: StringFieldUpdateOperationsInput | string
    generatedReceiptMessage?: StringFieldUpdateOperationsInput | string
    classificationReason?: StringFieldUpdateOperationsInput | string
    recommendedNextStep?: StringFieldUpdateOperationsInput | string
    serviceTags?: StringFieldUpdateOperationsInput | string
  }

  export type ServiceTypeCreateInput = {
    id?: string
    legacyId: string
    name: string
    category: string
    minPrice: number
    maxPrice: number
    isAppeal?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    quoteLineItems?: QuoteLineItemCreateNestedManyWithoutServiceTypeInput
  }

  export type ServiceTypeUncheckedCreateInput = {
    id?: string
    legacyId: string
    name: string
    category: string
    minPrice: number
    maxPrice: number
    isAppeal?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    quoteLineItems?: QuoteLineItemUncheckedCreateNestedManyWithoutServiceTypeInput
  }

  export type ServiceTypeUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    minPrice?: IntFieldUpdateOperationsInput | number
    maxPrice?: IntFieldUpdateOperationsInput | number
    isAppeal?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quoteLineItems?: QuoteLineItemUpdateManyWithoutServiceTypeNestedInput
  }

  export type ServiceTypeUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    minPrice?: IntFieldUpdateOperationsInput | number
    maxPrice?: IntFieldUpdateOperationsInput | number
    isAppeal?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quoteLineItems?: QuoteLineItemUncheckedUpdateManyWithoutServiceTypeNestedInput
  }

  export type ServiceTypeCreateManyInput = {
    id?: string
    legacyId: string
    name: string
    category: string
    minPrice: number
    maxPrice: number
    isAppeal?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ServiceTypeUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    minPrice?: IntFieldUpdateOperationsInput | number
    maxPrice?: IntFieldUpdateOperationsInput | number
    isAppeal?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ServiceTypeUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    minPrice?: IntFieldUpdateOperationsInput | number
    maxPrice?: IntFieldUpdateOperationsInput | number
    isAppeal?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PricingOptionCreateInput = {
    id?: string
    legacyId: string
    name: string
    description: string
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    unitLabel?: string | null
    isVat?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    quoteAdjustments?: QuoteAdjustmentCreateNestedManyWithoutPricingOptionInput
  }

  export type PricingOptionUncheckedCreateInput = {
    id?: string
    legacyId: string
    name: string
    description: string
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    unitLabel?: string | null
    isVat?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    quoteAdjustments?: QuoteAdjustmentUncheckedCreateNestedManyWithoutPricingOptionInput
  }

  export type PricingOptionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    unitLabel?: NullableStringFieldUpdateOperationsInput | string | null
    isVat?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quoteAdjustments?: QuoteAdjustmentUpdateManyWithoutPricingOptionNestedInput
  }

  export type PricingOptionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    unitLabel?: NullableStringFieldUpdateOperationsInput | string | null
    isVat?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quoteAdjustments?: QuoteAdjustmentUncheckedUpdateManyWithoutPricingOptionNestedInput
  }

  export type PricingOptionCreateManyInput = {
    id?: string
    legacyId: string
    name: string
    description: string
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    unitLabel?: string | null
    isVat?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PricingOptionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    unitLabel?: NullableStringFieldUpdateOperationsInput | string | null
    isVat?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PricingOptionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    unitLabel?: NullableStringFieldUpdateOperationsInput | string | null
    isVat?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PricingRuleCreateInput = {
    id?: string
    code: string
    ruleType: $Enums.PricingRuleType
    label: string
    description?: string | null
    numericValue?: number | null
    percentValue?: number | null
    jsonValue?: string | null
    isDefault?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PricingRuleUncheckedCreateInput = {
    id?: string
    code: string
    ruleType: $Enums.PricingRuleType
    label: string
    description?: string | null
    numericValue?: number | null
    percentValue?: number | null
    jsonValue?: string | null
    isDefault?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PricingRuleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    ruleType?: EnumPricingRuleTypeFieldUpdateOperationsInput | $Enums.PricingRuleType
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    numericValue?: NullableIntFieldUpdateOperationsInput | number | null
    percentValue?: NullableIntFieldUpdateOperationsInput | number | null
    jsonValue?: NullableStringFieldUpdateOperationsInput | string | null
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PricingRuleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    ruleType?: EnumPricingRuleTypeFieldUpdateOperationsInput | $Enums.PricingRuleType
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    numericValue?: NullableIntFieldUpdateOperationsInput | number | null
    percentValue?: NullableIntFieldUpdateOperationsInput | number | null
    jsonValue?: NullableStringFieldUpdateOperationsInput | string | null
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PricingRuleCreateManyInput = {
    id?: string
    code: string
    ruleType: $Enums.PricingRuleType
    label: string
    description?: string | null
    numericValue?: number | null
    percentValue?: number | null
    jsonValue?: string | null
    isDefault?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PricingRuleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    ruleType?: EnumPricingRuleTypeFieldUpdateOperationsInput | $Enums.PricingRuleType
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    numericValue?: NullableIntFieldUpdateOperationsInput | number | null
    percentValue?: NullableIntFieldUpdateOperationsInput | number | null
    jsonValue?: NullableStringFieldUpdateOperationsInput | string | null
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PricingRuleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    ruleType?: EnumPricingRuleTypeFieldUpdateOperationsInput | $Enums.PricingRuleType
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    numericValue?: NullableIntFieldUpdateOperationsInput | number | null
    percentValue?: NullableIntFieldUpdateOperationsInput | number | null
    jsonValue?: NullableStringFieldUpdateOperationsInput | string | null
    isDefault?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteCreateInput = {
    id?: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    inquiry: InquiryCreateNestedOneWithoutQuotesInput
    lineItems?: QuoteLineItemCreateNestedManyWithoutQuoteInput
    adjustments?: QuoteAdjustmentCreateNestedManyWithoutQuoteInput
    paymentPlans?: PaymentPlanCreateNestedManyWithoutQuoteInput
    contractDraft?: ContractDraftCreateNestedOneWithoutQuoteInput
  }

  export type QuoteUncheckedCreateInput = {
    id?: string
    inquiryId: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: QuoteLineItemUncheckedCreateNestedManyWithoutQuoteInput
    adjustments?: QuoteAdjustmentUncheckedCreateNestedManyWithoutQuoteInput
    paymentPlans?: PaymentPlanUncheckedCreateNestedManyWithoutQuoteInput
    contractDraft?: ContractDraftUncheckedCreateNestedOneWithoutQuoteInput
  }

  export type QuoteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inquiry?: InquiryUpdateOneRequiredWithoutQuotesNestedInput
    lineItems?: QuoteLineItemUpdateManyWithoutQuoteNestedInput
    adjustments?: QuoteAdjustmentUpdateManyWithoutQuoteNestedInput
    paymentPlans?: PaymentPlanUpdateManyWithoutQuoteNestedInput
    contractDraft?: ContractDraftUpdateOneWithoutQuoteNestedInput
  }

  export type QuoteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    inquiryId?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: QuoteLineItemUncheckedUpdateManyWithoutQuoteNestedInput
    adjustments?: QuoteAdjustmentUncheckedUpdateManyWithoutQuoteNestedInput
    paymentPlans?: PaymentPlanUncheckedUpdateManyWithoutQuoteNestedInput
    contractDraft?: ContractDraftUncheckedUpdateOneWithoutQuoteNestedInput
  }

  export type QuoteCreateManyInput = {
    id?: string
    inquiryId: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    inquiryId?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteLineItemCreateInput = {
    id?: string
    kind: $Enums.QuoteLineKind
    label: string
    description?: string | null
    amountMin: number
    amountMax: number
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    quote: QuoteCreateNestedOneWithoutLineItemsInput
    serviceType?: ServiceTypeCreateNestedOneWithoutQuoteLineItemsInput
  }

  export type QuoteLineItemUncheckedCreateInput = {
    id?: string
    quoteId: string
    serviceTypeId?: string | null
    kind: $Enums.QuoteLineKind
    label: string
    description?: string | null
    amountMin: number
    amountMax: number
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteLineItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: EnumQuoteLineKindFieldUpdateOperationsInput | $Enums.QuoteLineKind
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: QuoteUpdateOneRequiredWithoutLineItemsNestedInput
    serviceType?: ServiceTypeUpdateOneWithoutQuoteLineItemsNestedInput
  }

  export type QuoteLineItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    serviceTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumQuoteLineKindFieldUpdateOperationsInput | $Enums.QuoteLineKind
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteLineItemCreateManyInput = {
    id?: string
    quoteId: string
    serviceTypeId?: string | null
    kind: $Enums.QuoteLineKind
    label: string
    description?: string | null
    amountMin: number
    amountMax: number
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteLineItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: EnumQuoteLineKindFieldUpdateOperationsInput | $Enums.QuoteLineKind
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteLineItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    serviceTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumQuoteLineKindFieldUpdateOperationsInput | $Enums.QuoteLineKind
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteAdjustmentCreateInput = {
    id?: string
    label: string
    description?: string | null
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    computedMin: number
    computedMax: number
    isVat?: boolean
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    quote: QuoteCreateNestedOneWithoutAdjustmentsInput
    pricingOption?: PricingOptionCreateNestedOneWithoutQuoteAdjustmentsInput
  }

  export type QuoteAdjustmentUncheckedCreateInput = {
    id?: string
    quoteId: string
    pricingOptionId?: string | null
    label: string
    description?: string | null
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    computedMin: number
    computedMax: number
    isVat?: boolean
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteAdjustmentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    computedMin?: IntFieldUpdateOperationsInput | number
    computedMax?: IntFieldUpdateOperationsInput | number
    isVat?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: QuoteUpdateOneRequiredWithoutAdjustmentsNestedInput
    pricingOption?: PricingOptionUpdateOneWithoutQuoteAdjustmentsNestedInput
  }

  export type QuoteAdjustmentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    pricingOptionId?: NullableStringFieldUpdateOperationsInput | string | null
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    computedMin?: IntFieldUpdateOperationsInput | number
    computedMax?: IntFieldUpdateOperationsInput | number
    isVat?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteAdjustmentCreateManyInput = {
    id?: string
    quoteId: string
    pricingOptionId?: string | null
    label: string
    description?: string | null
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    computedMin: number
    computedMax: number
    isVat?: boolean
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteAdjustmentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    computedMin?: IntFieldUpdateOperationsInput | number
    computedMax?: IntFieldUpdateOperationsInput | number
    isVat?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteAdjustmentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    pricingOptionId?: NullableStringFieldUpdateOperationsInput | string | null
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    computedMin?: IntFieldUpdateOperationsInput | number
    computedMax?: IntFieldUpdateOperationsInput | number
    isVat?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentPlanCreateInput = {
    id?: string
    stageKind: $Enums.PaymentStageKind
    percentage: number
    dueText: string
    amountMin: number
    amountMax: number
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    quote: QuoteCreateNestedOneWithoutPaymentPlansInput
  }

  export type PaymentPlanUncheckedCreateInput = {
    id?: string
    quoteId: string
    stageKind: $Enums.PaymentStageKind
    percentage: number
    dueText: string
    amountMin: number
    amountMax: number
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentPlanUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    stageKind?: EnumPaymentStageKindFieldUpdateOperationsInput | $Enums.PaymentStageKind
    percentage?: IntFieldUpdateOperationsInput | number
    dueText?: StringFieldUpdateOperationsInput | string
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: QuoteUpdateOneRequiredWithoutPaymentPlansNestedInput
  }

  export type PaymentPlanUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    stageKind?: EnumPaymentStageKindFieldUpdateOperationsInput | $Enums.PaymentStageKind
    percentage?: IntFieldUpdateOperationsInput | number
    dueText?: StringFieldUpdateOperationsInput | string
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentPlanCreateManyInput = {
    id?: string
    quoteId: string
    stageKind: $Enums.PaymentStageKind
    percentage: number
    dueText: string
    amountMin: number
    amountMax: number
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentPlanUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    stageKind?: EnumPaymentStageKindFieldUpdateOperationsInput | $Enums.PaymentStageKind
    percentage?: IntFieldUpdateOperationsInput | number
    dueText?: StringFieldUpdateOperationsInput | string
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentPlanUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    stageKind?: EnumPaymentStageKindFieldUpdateOperationsInput | $Enums.PaymentStageKind
    percentage?: IntFieldUpdateOperationsInput | number
    dueText?: StringFieldUpdateOperationsInput | string
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContractDraftCreateInput = {
    id?: string
    status?: $Enums.ContractDraftStatus
    title: string
    bodyText: string
    scopeText?: string | null
    paymentSummary?: string | null
    successFeeRestricted?: boolean
    specialTerms?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    inquiry: InquiryCreateNestedOneWithoutContractDraftsInput
    quote: QuoteCreateNestedOneWithoutContractDraftInput
  }

  export type ContractDraftUncheckedCreateInput = {
    id?: string
    inquiryId: string
    quoteId: string
    status?: $Enums.ContractDraftStatus
    title: string
    bodyText: string
    scopeText?: string | null
    paymentSummary?: string | null
    successFeeRestricted?: boolean
    specialTerms?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContractDraftUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumContractDraftStatusFieldUpdateOperationsInput | $Enums.ContractDraftStatus
    title?: StringFieldUpdateOperationsInput | string
    bodyText?: StringFieldUpdateOperationsInput | string
    scopeText?: NullableStringFieldUpdateOperationsInput | string | null
    paymentSummary?: NullableStringFieldUpdateOperationsInput | string | null
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    specialTerms?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inquiry?: InquiryUpdateOneRequiredWithoutContractDraftsNestedInput
    quote?: QuoteUpdateOneRequiredWithoutContractDraftNestedInput
  }

  export type ContractDraftUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    inquiryId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    status?: EnumContractDraftStatusFieldUpdateOperationsInput | $Enums.ContractDraftStatus
    title?: StringFieldUpdateOperationsInput | string
    bodyText?: StringFieldUpdateOperationsInput | string
    scopeText?: NullableStringFieldUpdateOperationsInput | string | null
    paymentSummary?: NullableStringFieldUpdateOperationsInput | string | null
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    specialTerms?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContractDraftCreateManyInput = {
    id?: string
    inquiryId: string
    quoteId: string
    status?: $Enums.ContractDraftStatus
    title: string
    bodyText: string
    scopeText?: string | null
    paymentSummary?: string | null
    successFeeRestricted?: boolean
    specialTerms?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContractDraftUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumContractDraftStatusFieldUpdateOperationsInput | $Enums.ContractDraftStatus
    title?: StringFieldUpdateOperationsInput | string
    bodyText?: StringFieldUpdateOperationsInput | string
    scopeText?: NullableStringFieldUpdateOperationsInput | string | null
    paymentSummary?: NullableStringFieldUpdateOperationsInput | string | null
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    specialTerms?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContractDraftUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    inquiryId?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    status?: EnumContractDraftStatusFieldUpdateOperationsInput | $Enums.ContractDraftStatus
    title?: StringFieldUpdateOperationsInput | string
    bodyText?: StringFieldUpdateOperationsInput | string
    scopeText?: NullableStringFieldUpdateOperationsInput | string | null
    paymentSummary?: NullableStringFieldUpdateOperationsInput | string | null
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    specialTerms?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LegacyImportLogCreateInput = {
    id?: string
    source: string
    version: string
    payloadJson?: string | null
    importedAt?: Date | string
    createdCount?: number
  }

  export type LegacyImportLogUncheckedCreateInput = {
    id?: string
    source: string
    version: string
    payloadJson?: string | null
    importedAt?: Date | string
    createdCount?: number
  }

  export type LegacyImportLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    payloadJson?: NullableStringFieldUpdateOperationsInput | string | null
    importedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdCount?: IntFieldUpdateOperationsInput | number
  }

  export type LegacyImportLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    payloadJson?: NullableStringFieldUpdateOperationsInput | string | null
    importedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdCount?: IntFieldUpdateOperationsInput | number
  }

  export type LegacyImportLogCreateManyInput = {
    id?: string
    source: string
    version: string
    payloadJson?: string | null
    importedAt?: Date | string
    createdCount?: number
  }

  export type LegacyImportLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    payloadJson?: NullableStringFieldUpdateOperationsInput | string | null
    importedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdCount?: IntFieldUpdateOperationsInput | number
  }

  export type LegacyImportLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    version?: StringFieldUpdateOperationsInput | string
    payloadJson?: NullableStringFieldUpdateOperationsInput | string | null
    importedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdCount?: IntFieldUpdateOperationsInput | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EnumInquiryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.InquiryStatus | EnumInquiryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InquiryStatus[]
    notIn?: $Enums.InquiryStatus[]
    not?: NestedEnumInquiryStatusFilter<$PrismaModel> | $Enums.InquiryStatus
  }

  export type EnumInquiryTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.InquiryType | EnumInquiryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InquiryType[]
    notIn?: $Enums.InquiryType[]
    not?: NestedEnumInquiryTypeFilter<$PrismaModel> | $Enums.InquiryType
  }

  export type EnumUrgencyLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.UrgencyLevel | EnumUrgencyLevelFieldRefInput<$PrismaModel>
    in?: $Enums.UrgencyLevel[]
    notIn?: $Enums.UrgencyLevel[]
    not?: NestedEnumUrgencyLevelFilter<$PrismaModel> | $Enums.UrgencyLevel
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type EnumLanguageCodeFilter<$PrismaModel = never> = {
    equals?: $Enums.LanguageCode | EnumLanguageCodeFieldRefInput<$PrismaModel>
    in?: $Enums.LanguageCode[]
    notIn?: $Enums.LanguageCode[]
    not?: NestedEnumLanguageCodeFilter<$PrismaModel> | $Enums.LanguageCode
  }

  export type EnumClientTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ClientType | EnumClientTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ClientType[]
    notIn?: $Enums.ClientType[]
    not?: NestedEnumClientTypeFilter<$PrismaModel> | $Enums.ClientType
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type QuoteListRelationFilter = {
    every?: QuoteWhereInput
    some?: QuoteWhereInput
    none?: QuoteWhereInput
  }

  export type ContractDraftListRelationFilter = {
    every?: ContractDraftWhereInput
    some?: ContractDraftWhereInput
    none?: ContractDraftWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type QuoteOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ContractDraftOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InquiryCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    status?: SortOrder
    inquiryType?: SortOrder
    urgencyLevel?: SortOrder
    classificationConfidence?: SortOrder
    qualificationScore?: SortOrder
    preferredLanguage?: SortOrder
    clientType?: SortOrder
    contactName?: SortOrder
    organizationName?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    title?: SortOrder
    description?: SortOrder
    nationality?: SortOrder
    currentStatus?: SortOrder
    documentCountry?: SortOrder
    targetAgency?: SortOrder
    dueDate?: SortOrder
    assignee?: SortOrder
    internalMemo?: SortOrder
    wantsCallback?: SortOrder
    consentToPrivacy?: SortOrder
    intakeSource?: SortOrder
    generatedSummary?: SortOrder
    generatedGuidance?: SortOrder
    generatedReceiptMessage?: SortOrder
    classificationReason?: SortOrder
    recommendedNextStep?: SortOrder
    serviceTags?: SortOrder
  }

  export type InquiryAvgOrderByAggregateInput = {
    classificationConfidence?: SortOrder
    qualificationScore?: SortOrder
  }

  export type InquiryMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    status?: SortOrder
    inquiryType?: SortOrder
    urgencyLevel?: SortOrder
    classificationConfidence?: SortOrder
    qualificationScore?: SortOrder
    preferredLanguage?: SortOrder
    clientType?: SortOrder
    contactName?: SortOrder
    organizationName?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    title?: SortOrder
    description?: SortOrder
    nationality?: SortOrder
    currentStatus?: SortOrder
    documentCountry?: SortOrder
    targetAgency?: SortOrder
    dueDate?: SortOrder
    assignee?: SortOrder
    internalMemo?: SortOrder
    wantsCallback?: SortOrder
    consentToPrivacy?: SortOrder
    intakeSource?: SortOrder
    generatedSummary?: SortOrder
    generatedGuidance?: SortOrder
    generatedReceiptMessage?: SortOrder
    classificationReason?: SortOrder
    recommendedNextStep?: SortOrder
    serviceTags?: SortOrder
  }

  export type InquiryMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    status?: SortOrder
    inquiryType?: SortOrder
    urgencyLevel?: SortOrder
    classificationConfidence?: SortOrder
    qualificationScore?: SortOrder
    preferredLanguage?: SortOrder
    clientType?: SortOrder
    contactName?: SortOrder
    organizationName?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    title?: SortOrder
    description?: SortOrder
    nationality?: SortOrder
    currentStatus?: SortOrder
    documentCountry?: SortOrder
    targetAgency?: SortOrder
    dueDate?: SortOrder
    assignee?: SortOrder
    internalMemo?: SortOrder
    wantsCallback?: SortOrder
    consentToPrivacy?: SortOrder
    intakeSource?: SortOrder
    generatedSummary?: SortOrder
    generatedGuidance?: SortOrder
    generatedReceiptMessage?: SortOrder
    classificationReason?: SortOrder
    recommendedNextStep?: SortOrder
    serviceTags?: SortOrder
  }

  export type InquirySumOrderByAggregateInput = {
    classificationConfidence?: SortOrder
    qualificationScore?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumInquiryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InquiryStatus | EnumInquiryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InquiryStatus[]
    notIn?: $Enums.InquiryStatus[]
    not?: NestedEnumInquiryStatusWithAggregatesFilter<$PrismaModel> | $Enums.InquiryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInquiryStatusFilter<$PrismaModel>
    _max?: NestedEnumInquiryStatusFilter<$PrismaModel>
  }

  export type EnumInquiryTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InquiryType | EnumInquiryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InquiryType[]
    notIn?: $Enums.InquiryType[]
    not?: NestedEnumInquiryTypeWithAggregatesFilter<$PrismaModel> | $Enums.InquiryType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInquiryTypeFilter<$PrismaModel>
    _max?: NestedEnumInquiryTypeFilter<$PrismaModel>
  }

  export type EnumUrgencyLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UrgencyLevel | EnumUrgencyLevelFieldRefInput<$PrismaModel>
    in?: $Enums.UrgencyLevel[]
    notIn?: $Enums.UrgencyLevel[]
    not?: NestedEnumUrgencyLevelWithAggregatesFilter<$PrismaModel> | $Enums.UrgencyLevel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUrgencyLevelFilter<$PrismaModel>
    _max?: NestedEnumUrgencyLevelFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type EnumLanguageCodeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LanguageCode | EnumLanguageCodeFieldRefInput<$PrismaModel>
    in?: $Enums.LanguageCode[]
    notIn?: $Enums.LanguageCode[]
    not?: NestedEnumLanguageCodeWithAggregatesFilter<$PrismaModel> | $Enums.LanguageCode
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLanguageCodeFilter<$PrismaModel>
    _max?: NestedEnumLanguageCodeFilter<$PrismaModel>
  }

  export type EnumClientTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ClientType | EnumClientTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ClientType[]
    notIn?: $Enums.ClientType[]
    not?: NestedEnumClientTypeWithAggregatesFilter<$PrismaModel> | $Enums.ClientType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumClientTypeFilter<$PrismaModel>
    _max?: NestedEnumClientTypeFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type QuoteLineItemListRelationFilter = {
    every?: QuoteLineItemWhereInput
    some?: QuoteLineItemWhereInput
    none?: QuoteLineItemWhereInput
  }

  export type QuoteLineItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ServiceTypeCountOrderByAggregateInput = {
    id?: SortOrder
    legacyId?: SortOrder
    name?: SortOrder
    category?: SortOrder
    minPrice?: SortOrder
    maxPrice?: SortOrder
    isAppeal?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ServiceTypeAvgOrderByAggregateInput = {
    minPrice?: SortOrder
    maxPrice?: SortOrder
  }

  export type ServiceTypeMaxOrderByAggregateInput = {
    id?: SortOrder
    legacyId?: SortOrder
    name?: SortOrder
    category?: SortOrder
    minPrice?: SortOrder
    maxPrice?: SortOrder
    isAppeal?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ServiceTypeMinOrderByAggregateInput = {
    id?: SortOrder
    legacyId?: SortOrder
    name?: SortOrder
    category?: SortOrder
    minPrice?: SortOrder
    maxPrice?: SortOrder
    isAppeal?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ServiceTypeSumOrderByAggregateInput = {
    minPrice?: SortOrder
    maxPrice?: SortOrder
  }

  export type EnumPricingOptionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingOptionType | EnumPricingOptionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingOptionType[]
    notIn?: $Enums.PricingOptionType[]
    not?: NestedEnumPricingOptionTypeFilter<$PrismaModel> | $Enums.PricingOptionType
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type QuoteAdjustmentListRelationFilter = {
    every?: QuoteAdjustmentWhereInput
    some?: QuoteAdjustmentWhereInput
    none?: QuoteAdjustmentWhereInput
  }

  export type QuoteAdjustmentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PricingOptionCountOrderByAggregateInput = {
    id?: SortOrder
    legacyId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    optionType?: SortOrder
    flatAmount?: SortOrder
    percentRate?: SortOrder
    unitLabel?: SortOrder
    isVat?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingOptionAvgOrderByAggregateInput = {
    flatAmount?: SortOrder
    percentRate?: SortOrder
  }

  export type PricingOptionMaxOrderByAggregateInput = {
    id?: SortOrder
    legacyId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    optionType?: SortOrder
    flatAmount?: SortOrder
    percentRate?: SortOrder
    unitLabel?: SortOrder
    isVat?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingOptionMinOrderByAggregateInput = {
    id?: SortOrder
    legacyId?: SortOrder
    name?: SortOrder
    description?: SortOrder
    optionType?: SortOrder
    flatAmount?: SortOrder
    percentRate?: SortOrder
    unitLabel?: SortOrder
    isVat?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingOptionSumOrderByAggregateInput = {
    flatAmount?: SortOrder
    percentRate?: SortOrder
  }

  export type EnumPricingOptionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingOptionType | EnumPricingOptionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingOptionType[]
    notIn?: $Enums.PricingOptionType[]
    not?: NestedEnumPricingOptionTypeWithAggregatesFilter<$PrismaModel> | $Enums.PricingOptionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPricingOptionTypeFilter<$PrismaModel>
    _max?: NestedEnumPricingOptionTypeFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumPricingRuleTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingRuleType | EnumPricingRuleTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingRuleType[]
    notIn?: $Enums.PricingRuleType[]
    not?: NestedEnumPricingRuleTypeFilter<$PrismaModel> | $Enums.PricingRuleType
  }

  export type PricingRuleCountOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    ruleType?: SortOrder
    label?: SortOrder
    description?: SortOrder
    numericValue?: SortOrder
    percentValue?: SortOrder
    jsonValue?: SortOrder
    isDefault?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingRuleAvgOrderByAggregateInput = {
    numericValue?: SortOrder
    percentValue?: SortOrder
  }

  export type PricingRuleMaxOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    ruleType?: SortOrder
    label?: SortOrder
    description?: SortOrder
    numericValue?: SortOrder
    percentValue?: SortOrder
    jsonValue?: SortOrder
    isDefault?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingRuleMinOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    ruleType?: SortOrder
    label?: SortOrder
    description?: SortOrder
    numericValue?: SortOrder
    percentValue?: SortOrder
    jsonValue?: SortOrder
    isDefault?: SortOrder
    isActive?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingRuleSumOrderByAggregateInput = {
    numericValue?: SortOrder
    percentValue?: SortOrder
  }

  export type EnumPricingRuleTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingRuleType | EnumPricingRuleTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingRuleType[]
    notIn?: $Enums.PricingRuleType[]
    not?: NestedEnumPricingRuleTypeWithAggregatesFilter<$PrismaModel> | $Enums.PricingRuleType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPricingRuleTypeFilter<$PrismaModel>
    _max?: NestedEnumPricingRuleTypeFilter<$PrismaModel>
  }

  export type EnumQuoteStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteStatus | EnumQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteStatus[]
    notIn?: $Enums.QuoteStatus[]
    not?: NestedEnumQuoteStatusFilter<$PrismaModel> | $Enums.QuoteStatus
  }

  export type InquiryScalarRelationFilter = {
    is?: InquiryWhereInput
    isNot?: InquiryWhereInput
  }

  export type PaymentPlanListRelationFilter = {
    every?: PaymentPlanWhereInput
    some?: PaymentPlanWhereInput
    none?: PaymentPlanWhereInput
  }

  export type ContractDraftNullableScalarRelationFilter = {
    is?: ContractDraftWhereInput | null
    isNot?: ContractDraftWhereInput | null
  }

  export type PaymentPlanOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type QuoteCountOrderByAggregateInput = {
    id?: SortOrder
    inquiryId?: SortOrder
    status?: SortOrder
    selectedServiceLegacyIds?: SortOrder
    selectedOptionLegacyIds?: SortOrder
    urgencyRuleCode?: SortOrder
    consultRuleCode?: SortOrder
    paymentRuleCode?: SortOrder
    rangeMode?: SortOrder
    serviceBaseMin?: SortOrder
    serviceBaseMax?: SortOrder
    subtotalMin?: SortOrder
    subtotalMax?: SortOrder
    vatAmountMin?: SortOrder
    vatAmountMax?: SortOrder
    totalMin?: SortOrder
    totalMax?: SortOrder
    consultFee?: SortOrder
    successFeeRestricted?: SortOrder
    draftNotes?: SortOrder
    calculationSummary?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteAvgOrderByAggregateInput = {
    serviceBaseMin?: SortOrder
    serviceBaseMax?: SortOrder
    subtotalMin?: SortOrder
    subtotalMax?: SortOrder
    vatAmountMin?: SortOrder
    vatAmountMax?: SortOrder
    totalMin?: SortOrder
    totalMax?: SortOrder
    consultFee?: SortOrder
  }

  export type QuoteMaxOrderByAggregateInput = {
    id?: SortOrder
    inquiryId?: SortOrder
    status?: SortOrder
    selectedServiceLegacyIds?: SortOrder
    selectedOptionLegacyIds?: SortOrder
    urgencyRuleCode?: SortOrder
    consultRuleCode?: SortOrder
    paymentRuleCode?: SortOrder
    rangeMode?: SortOrder
    serviceBaseMin?: SortOrder
    serviceBaseMax?: SortOrder
    subtotalMin?: SortOrder
    subtotalMax?: SortOrder
    vatAmountMin?: SortOrder
    vatAmountMax?: SortOrder
    totalMin?: SortOrder
    totalMax?: SortOrder
    consultFee?: SortOrder
    successFeeRestricted?: SortOrder
    draftNotes?: SortOrder
    calculationSummary?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteMinOrderByAggregateInput = {
    id?: SortOrder
    inquiryId?: SortOrder
    status?: SortOrder
    selectedServiceLegacyIds?: SortOrder
    selectedOptionLegacyIds?: SortOrder
    urgencyRuleCode?: SortOrder
    consultRuleCode?: SortOrder
    paymentRuleCode?: SortOrder
    rangeMode?: SortOrder
    serviceBaseMin?: SortOrder
    serviceBaseMax?: SortOrder
    subtotalMin?: SortOrder
    subtotalMax?: SortOrder
    vatAmountMin?: SortOrder
    vatAmountMax?: SortOrder
    totalMin?: SortOrder
    totalMax?: SortOrder
    consultFee?: SortOrder
    successFeeRestricted?: SortOrder
    draftNotes?: SortOrder
    calculationSummary?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteSumOrderByAggregateInput = {
    serviceBaseMin?: SortOrder
    serviceBaseMax?: SortOrder
    subtotalMin?: SortOrder
    subtotalMax?: SortOrder
    vatAmountMin?: SortOrder
    vatAmountMax?: SortOrder
    totalMin?: SortOrder
    totalMax?: SortOrder
    consultFee?: SortOrder
  }

  export type EnumQuoteStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteStatus | EnumQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteStatus[]
    notIn?: $Enums.QuoteStatus[]
    not?: NestedEnumQuoteStatusWithAggregatesFilter<$PrismaModel> | $Enums.QuoteStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuoteStatusFilter<$PrismaModel>
    _max?: NestedEnumQuoteStatusFilter<$PrismaModel>
  }

  export type EnumQuoteLineKindFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteLineKind | EnumQuoteLineKindFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteLineKind[]
    notIn?: $Enums.QuoteLineKind[]
    not?: NestedEnumQuoteLineKindFilter<$PrismaModel> | $Enums.QuoteLineKind
  }

  export type QuoteScalarRelationFilter = {
    is?: QuoteWhereInput
    isNot?: QuoteWhereInput
  }

  export type ServiceTypeNullableScalarRelationFilter = {
    is?: ServiceTypeWhereInput | null
    isNot?: ServiceTypeWhereInput | null
  }

  export type QuoteLineItemCountOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    serviceTypeId?: SortOrder
    kind?: SortOrder
    label?: SortOrder
    description?: SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
    isManual?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteLineItemAvgOrderByAggregateInput = {
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
  }

  export type QuoteLineItemMaxOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    serviceTypeId?: SortOrder
    kind?: SortOrder
    label?: SortOrder
    description?: SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
    isManual?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteLineItemMinOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    serviceTypeId?: SortOrder
    kind?: SortOrder
    label?: SortOrder
    description?: SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
    isManual?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteLineItemSumOrderByAggregateInput = {
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
  }

  export type EnumQuoteLineKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteLineKind | EnumQuoteLineKindFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteLineKind[]
    notIn?: $Enums.QuoteLineKind[]
    not?: NestedEnumQuoteLineKindWithAggregatesFilter<$PrismaModel> | $Enums.QuoteLineKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuoteLineKindFilter<$PrismaModel>
    _max?: NestedEnumQuoteLineKindFilter<$PrismaModel>
  }

  export type PricingOptionNullableScalarRelationFilter = {
    is?: PricingOptionWhereInput | null
    isNot?: PricingOptionWhereInput | null
  }

  export type QuoteAdjustmentCountOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    pricingOptionId?: SortOrder
    label?: SortOrder
    description?: SortOrder
    optionType?: SortOrder
    flatAmount?: SortOrder
    percentRate?: SortOrder
    computedMin?: SortOrder
    computedMax?: SortOrder
    isVat?: SortOrder
    sortOrder?: SortOrder
    isManual?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteAdjustmentAvgOrderByAggregateInput = {
    flatAmount?: SortOrder
    percentRate?: SortOrder
    computedMin?: SortOrder
    computedMax?: SortOrder
    sortOrder?: SortOrder
  }

  export type QuoteAdjustmentMaxOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    pricingOptionId?: SortOrder
    label?: SortOrder
    description?: SortOrder
    optionType?: SortOrder
    flatAmount?: SortOrder
    percentRate?: SortOrder
    computedMin?: SortOrder
    computedMax?: SortOrder
    isVat?: SortOrder
    sortOrder?: SortOrder
    isManual?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteAdjustmentMinOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    pricingOptionId?: SortOrder
    label?: SortOrder
    description?: SortOrder
    optionType?: SortOrder
    flatAmount?: SortOrder
    percentRate?: SortOrder
    computedMin?: SortOrder
    computedMax?: SortOrder
    isVat?: SortOrder
    sortOrder?: SortOrder
    isManual?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type QuoteAdjustmentSumOrderByAggregateInput = {
    flatAmount?: SortOrder
    percentRate?: SortOrder
    computedMin?: SortOrder
    computedMax?: SortOrder
    sortOrder?: SortOrder
  }

  export type EnumPaymentStageKindFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStageKind | EnumPaymentStageKindFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStageKind[]
    notIn?: $Enums.PaymentStageKind[]
    not?: NestedEnumPaymentStageKindFilter<$PrismaModel> | $Enums.PaymentStageKind
  }

  export type PaymentPlanCountOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    stageKind?: SortOrder
    percentage?: SortOrder
    dueText?: SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentPlanAvgOrderByAggregateInput = {
    percentage?: SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
  }

  export type PaymentPlanMaxOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    stageKind?: SortOrder
    percentage?: SortOrder
    dueText?: SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentPlanMinOrderByAggregateInput = {
    id?: SortOrder
    quoteId?: SortOrder
    stageKind?: SortOrder
    percentage?: SortOrder
    dueText?: SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentPlanSumOrderByAggregateInput = {
    percentage?: SortOrder
    amountMin?: SortOrder
    amountMax?: SortOrder
    sortOrder?: SortOrder
  }

  export type EnumPaymentStageKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStageKind | EnumPaymentStageKindFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStageKind[]
    notIn?: $Enums.PaymentStageKind[]
    not?: NestedEnumPaymentStageKindWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStageKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStageKindFilter<$PrismaModel>
    _max?: NestedEnumPaymentStageKindFilter<$PrismaModel>
  }

  export type EnumContractDraftStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ContractDraftStatus | EnumContractDraftStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ContractDraftStatus[]
    notIn?: $Enums.ContractDraftStatus[]
    not?: NestedEnumContractDraftStatusFilter<$PrismaModel> | $Enums.ContractDraftStatus
  }

  export type ContractDraftCountOrderByAggregateInput = {
    id?: SortOrder
    inquiryId?: SortOrder
    quoteId?: SortOrder
    status?: SortOrder
    title?: SortOrder
    bodyText?: SortOrder
    scopeText?: SortOrder
    paymentSummary?: SortOrder
    successFeeRestricted?: SortOrder
    specialTerms?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContractDraftMaxOrderByAggregateInput = {
    id?: SortOrder
    inquiryId?: SortOrder
    quoteId?: SortOrder
    status?: SortOrder
    title?: SortOrder
    bodyText?: SortOrder
    scopeText?: SortOrder
    paymentSummary?: SortOrder
    successFeeRestricted?: SortOrder
    specialTerms?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ContractDraftMinOrderByAggregateInput = {
    id?: SortOrder
    inquiryId?: SortOrder
    quoteId?: SortOrder
    status?: SortOrder
    title?: SortOrder
    bodyText?: SortOrder
    scopeText?: SortOrder
    paymentSummary?: SortOrder
    successFeeRestricted?: SortOrder
    specialTerms?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumContractDraftStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ContractDraftStatus | EnumContractDraftStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ContractDraftStatus[]
    notIn?: $Enums.ContractDraftStatus[]
    not?: NestedEnumContractDraftStatusWithAggregatesFilter<$PrismaModel> | $Enums.ContractDraftStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumContractDraftStatusFilter<$PrismaModel>
    _max?: NestedEnumContractDraftStatusFilter<$PrismaModel>
  }

  export type LegacyImportLogCountOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    version?: SortOrder
    payloadJson?: SortOrder
    importedAt?: SortOrder
    createdCount?: SortOrder
  }

  export type LegacyImportLogAvgOrderByAggregateInput = {
    createdCount?: SortOrder
  }

  export type LegacyImportLogMaxOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    version?: SortOrder
    payloadJson?: SortOrder
    importedAt?: SortOrder
    createdCount?: SortOrder
  }

  export type LegacyImportLogMinOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    version?: SortOrder
    payloadJson?: SortOrder
    importedAt?: SortOrder
    createdCount?: SortOrder
  }

  export type LegacyImportLogSumOrderByAggregateInput = {
    createdCount?: SortOrder
  }

  export type QuoteCreateNestedManyWithoutInquiryInput = {
    create?: XOR<QuoteCreateWithoutInquiryInput, QuoteUncheckedCreateWithoutInquiryInput> | QuoteCreateWithoutInquiryInput[] | QuoteUncheckedCreateWithoutInquiryInput[]
    connectOrCreate?: QuoteCreateOrConnectWithoutInquiryInput | QuoteCreateOrConnectWithoutInquiryInput[]
    createMany?: QuoteCreateManyInquiryInputEnvelope
    connect?: QuoteWhereUniqueInput | QuoteWhereUniqueInput[]
  }

  export type ContractDraftCreateNestedManyWithoutInquiryInput = {
    create?: XOR<ContractDraftCreateWithoutInquiryInput, ContractDraftUncheckedCreateWithoutInquiryInput> | ContractDraftCreateWithoutInquiryInput[] | ContractDraftUncheckedCreateWithoutInquiryInput[]
    connectOrCreate?: ContractDraftCreateOrConnectWithoutInquiryInput | ContractDraftCreateOrConnectWithoutInquiryInput[]
    createMany?: ContractDraftCreateManyInquiryInputEnvelope
    connect?: ContractDraftWhereUniqueInput | ContractDraftWhereUniqueInput[]
  }

  export type QuoteUncheckedCreateNestedManyWithoutInquiryInput = {
    create?: XOR<QuoteCreateWithoutInquiryInput, QuoteUncheckedCreateWithoutInquiryInput> | QuoteCreateWithoutInquiryInput[] | QuoteUncheckedCreateWithoutInquiryInput[]
    connectOrCreate?: QuoteCreateOrConnectWithoutInquiryInput | QuoteCreateOrConnectWithoutInquiryInput[]
    createMany?: QuoteCreateManyInquiryInputEnvelope
    connect?: QuoteWhereUniqueInput | QuoteWhereUniqueInput[]
  }

  export type ContractDraftUncheckedCreateNestedManyWithoutInquiryInput = {
    create?: XOR<ContractDraftCreateWithoutInquiryInput, ContractDraftUncheckedCreateWithoutInquiryInput> | ContractDraftCreateWithoutInquiryInput[] | ContractDraftUncheckedCreateWithoutInquiryInput[]
    connectOrCreate?: ContractDraftCreateOrConnectWithoutInquiryInput | ContractDraftCreateOrConnectWithoutInquiryInput[]
    createMany?: ContractDraftCreateManyInquiryInputEnvelope
    connect?: ContractDraftWhereUniqueInput | ContractDraftWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EnumInquiryStatusFieldUpdateOperationsInput = {
    set?: $Enums.InquiryStatus
  }

  export type EnumInquiryTypeFieldUpdateOperationsInput = {
    set?: $Enums.InquiryType
  }

  export type EnumUrgencyLevelFieldUpdateOperationsInput = {
    set?: $Enums.UrgencyLevel
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumLanguageCodeFieldUpdateOperationsInput = {
    set?: $Enums.LanguageCode
  }

  export type EnumClientTypeFieldUpdateOperationsInput = {
    set?: $Enums.ClientType
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type QuoteUpdateManyWithoutInquiryNestedInput = {
    create?: XOR<QuoteCreateWithoutInquiryInput, QuoteUncheckedCreateWithoutInquiryInput> | QuoteCreateWithoutInquiryInput[] | QuoteUncheckedCreateWithoutInquiryInput[]
    connectOrCreate?: QuoteCreateOrConnectWithoutInquiryInput | QuoteCreateOrConnectWithoutInquiryInput[]
    upsert?: QuoteUpsertWithWhereUniqueWithoutInquiryInput | QuoteUpsertWithWhereUniqueWithoutInquiryInput[]
    createMany?: QuoteCreateManyInquiryInputEnvelope
    set?: QuoteWhereUniqueInput | QuoteWhereUniqueInput[]
    disconnect?: QuoteWhereUniqueInput | QuoteWhereUniqueInput[]
    delete?: QuoteWhereUniqueInput | QuoteWhereUniqueInput[]
    connect?: QuoteWhereUniqueInput | QuoteWhereUniqueInput[]
    update?: QuoteUpdateWithWhereUniqueWithoutInquiryInput | QuoteUpdateWithWhereUniqueWithoutInquiryInput[]
    updateMany?: QuoteUpdateManyWithWhereWithoutInquiryInput | QuoteUpdateManyWithWhereWithoutInquiryInput[]
    deleteMany?: QuoteScalarWhereInput | QuoteScalarWhereInput[]
  }

  export type ContractDraftUpdateManyWithoutInquiryNestedInput = {
    create?: XOR<ContractDraftCreateWithoutInquiryInput, ContractDraftUncheckedCreateWithoutInquiryInput> | ContractDraftCreateWithoutInquiryInput[] | ContractDraftUncheckedCreateWithoutInquiryInput[]
    connectOrCreate?: ContractDraftCreateOrConnectWithoutInquiryInput | ContractDraftCreateOrConnectWithoutInquiryInput[]
    upsert?: ContractDraftUpsertWithWhereUniqueWithoutInquiryInput | ContractDraftUpsertWithWhereUniqueWithoutInquiryInput[]
    createMany?: ContractDraftCreateManyInquiryInputEnvelope
    set?: ContractDraftWhereUniqueInput | ContractDraftWhereUniqueInput[]
    disconnect?: ContractDraftWhereUniqueInput | ContractDraftWhereUniqueInput[]
    delete?: ContractDraftWhereUniqueInput | ContractDraftWhereUniqueInput[]
    connect?: ContractDraftWhereUniqueInput | ContractDraftWhereUniqueInput[]
    update?: ContractDraftUpdateWithWhereUniqueWithoutInquiryInput | ContractDraftUpdateWithWhereUniqueWithoutInquiryInput[]
    updateMany?: ContractDraftUpdateManyWithWhereWithoutInquiryInput | ContractDraftUpdateManyWithWhereWithoutInquiryInput[]
    deleteMany?: ContractDraftScalarWhereInput | ContractDraftScalarWhereInput[]
  }

  export type QuoteUncheckedUpdateManyWithoutInquiryNestedInput = {
    create?: XOR<QuoteCreateWithoutInquiryInput, QuoteUncheckedCreateWithoutInquiryInput> | QuoteCreateWithoutInquiryInput[] | QuoteUncheckedCreateWithoutInquiryInput[]
    connectOrCreate?: QuoteCreateOrConnectWithoutInquiryInput | QuoteCreateOrConnectWithoutInquiryInput[]
    upsert?: QuoteUpsertWithWhereUniqueWithoutInquiryInput | QuoteUpsertWithWhereUniqueWithoutInquiryInput[]
    createMany?: QuoteCreateManyInquiryInputEnvelope
    set?: QuoteWhereUniqueInput | QuoteWhereUniqueInput[]
    disconnect?: QuoteWhereUniqueInput | QuoteWhereUniqueInput[]
    delete?: QuoteWhereUniqueInput | QuoteWhereUniqueInput[]
    connect?: QuoteWhereUniqueInput | QuoteWhereUniqueInput[]
    update?: QuoteUpdateWithWhereUniqueWithoutInquiryInput | QuoteUpdateWithWhereUniqueWithoutInquiryInput[]
    updateMany?: QuoteUpdateManyWithWhereWithoutInquiryInput | QuoteUpdateManyWithWhereWithoutInquiryInput[]
    deleteMany?: QuoteScalarWhereInput | QuoteScalarWhereInput[]
  }

  export type ContractDraftUncheckedUpdateManyWithoutInquiryNestedInput = {
    create?: XOR<ContractDraftCreateWithoutInquiryInput, ContractDraftUncheckedCreateWithoutInquiryInput> | ContractDraftCreateWithoutInquiryInput[] | ContractDraftUncheckedCreateWithoutInquiryInput[]
    connectOrCreate?: ContractDraftCreateOrConnectWithoutInquiryInput | ContractDraftCreateOrConnectWithoutInquiryInput[]
    upsert?: ContractDraftUpsertWithWhereUniqueWithoutInquiryInput | ContractDraftUpsertWithWhereUniqueWithoutInquiryInput[]
    createMany?: ContractDraftCreateManyInquiryInputEnvelope
    set?: ContractDraftWhereUniqueInput | ContractDraftWhereUniqueInput[]
    disconnect?: ContractDraftWhereUniqueInput | ContractDraftWhereUniqueInput[]
    delete?: ContractDraftWhereUniqueInput | ContractDraftWhereUniqueInput[]
    connect?: ContractDraftWhereUniqueInput | ContractDraftWhereUniqueInput[]
    update?: ContractDraftUpdateWithWhereUniqueWithoutInquiryInput | ContractDraftUpdateWithWhereUniqueWithoutInquiryInput[]
    updateMany?: ContractDraftUpdateManyWithWhereWithoutInquiryInput | ContractDraftUpdateManyWithWhereWithoutInquiryInput[]
    deleteMany?: ContractDraftScalarWhereInput | ContractDraftScalarWhereInput[]
  }

  export type QuoteLineItemCreateNestedManyWithoutServiceTypeInput = {
    create?: XOR<QuoteLineItemCreateWithoutServiceTypeInput, QuoteLineItemUncheckedCreateWithoutServiceTypeInput> | QuoteLineItemCreateWithoutServiceTypeInput[] | QuoteLineItemUncheckedCreateWithoutServiceTypeInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutServiceTypeInput | QuoteLineItemCreateOrConnectWithoutServiceTypeInput[]
    createMany?: QuoteLineItemCreateManyServiceTypeInputEnvelope
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
  }

  export type QuoteLineItemUncheckedCreateNestedManyWithoutServiceTypeInput = {
    create?: XOR<QuoteLineItemCreateWithoutServiceTypeInput, QuoteLineItemUncheckedCreateWithoutServiceTypeInput> | QuoteLineItemCreateWithoutServiceTypeInput[] | QuoteLineItemUncheckedCreateWithoutServiceTypeInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutServiceTypeInput | QuoteLineItemCreateOrConnectWithoutServiceTypeInput[]
    createMany?: QuoteLineItemCreateManyServiceTypeInputEnvelope
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
  }

  export type QuoteLineItemUpdateManyWithoutServiceTypeNestedInput = {
    create?: XOR<QuoteLineItemCreateWithoutServiceTypeInput, QuoteLineItemUncheckedCreateWithoutServiceTypeInput> | QuoteLineItemCreateWithoutServiceTypeInput[] | QuoteLineItemUncheckedCreateWithoutServiceTypeInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutServiceTypeInput | QuoteLineItemCreateOrConnectWithoutServiceTypeInput[]
    upsert?: QuoteLineItemUpsertWithWhereUniqueWithoutServiceTypeInput | QuoteLineItemUpsertWithWhereUniqueWithoutServiceTypeInput[]
    createMany?: QuoteLineItemCreateManyServiceTypeInputEnvelope
    set?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    disconnect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    delete?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    update?: QuoteLineItemUpdateWithWhereUniqueWithoutServiceTypeInput | QuoteLineItemUpdateWithWhereUniqueWithoutServiceTypeInput[]
    updateMany?: QuoteLineItemUpdateManyWithWhereWithoutServiceTypeInput | QuoteLineItemUpdateManyWithWhereWithoutServiceTypeInput[]
    deleteMany?: QuoteLineItemScalarWhereInput | QuoteLineItemScalarWhereInput[]
  }

  export type QuoteLineItemUncheckedUpdateManyWithoutServiceTypeNestedInput = {
    create?: XOR<QuoteLineItemCreateWithoutServiceTypeInput, QuoteLineItemUncheckedCreateWithoutServiceTypeInput> | QuoteLineItemCreateWithoutServiceTypeInput[] | QuoteLineItemUncheckedCreateWithoutServiceTypeInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutServiceTypeInput | QuoteLineItemCreateOrConnectWithoutServiceTypeInput[]
    upsert?: QuoteLineItemUpsertWithWhereUniqueWithoutServiceTypeInput | QuoteLineItemUpsertWithWhereUniqueWithoutServiceTypeInput[]
    createMany?: QuoteLineItemCreateManyServiceTypeInputEnvelope
    set?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    disconnect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    delete?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    update?: QuoteLineItemUpdateWithWhereUniqueWithoutServiceTypeInput | QuoteLineItemUpdateWithWhereUniqueWithoutServiceTypeInput[]
    updateMany?: QuoteLineItemUpdateManyWithWhereWithoutServiceTypeInput | QuoteLineItemUpdateManyWithWhereWithoutServiceTypeInput[]
    deleteMany?: QuoteLineItemScalarWhereInput | QuoteLineItemScalarWhereInput[]
  }

  export type QuoteAdjustmentCreateNestedManyWithoutPricingOptionInput = {
    create?: XOR<QuoteAdjustmentCreateWithoutPricingOptionInput, QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput> | QuoteAdjustmentCreateWithoutPricingOptionInput[] | QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput[]
    connectOrCreate?: QuoteAdjustmentCreateOrConnectWithoutPricingOptionInput | QuoteAdjustmentCreateOrConnectWithoutPricingOptionInput[]
    createMany?: QuoteAdjustmentCreateManyPricingOptionInputEnvelope
    connect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
  }

  export type QuoteAdjustmentUncheckedCreateNestedManyWithoutPricingOptionInput = {
    create?: XOR<QuoteAdjustmentCreateWithoutPricingOptionInput, QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput> | QuoteAdjustmentCreateWithoutPricingOptionInput[] | QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput[]
    connectOrCreate?: QuoteAdjustmentCreateOrConnectWithoutPricingOptionInput | QuoteAdjustmentCreateOrConnectWithoutPricingOptionInput[]
    createMany?: QuoteAdjustmentCreateManyPricingOptionInputEnvelope
    connect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
  }

  export type EnumPricingOptionTypeFieldUpdateOperationsInput = {
    set?: $Enums.PricingOptionType
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type QuoteAdjustmentUpdateManyWithoutPricingOptionNestedInput = {
    create?: XOR<QuoteAdjustmentCreateWithoutPricingOptionInput, QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput> | QuoteAdjustmentCreateWithoutPricingOptionInput[] | QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput[]
    connectOrCreate?: QuoteAdjustmentCreateOrConnectWithoutPricingOptionInput | QuoteAdjustmentCreateOrConnectWithoutPricingOptionInput[]
    upsert?: QuoteAdjustmentUpsertWithWhereUniqueWithoutPricingOptionInput | QuoteAdjustmentUpsertWithWhereUniqueWithoutPricingOptionInput[]
    createMany?: QuoteAdjustmentCreateManyPricingOptionInputEnvelope
    set?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    disconnect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    delete?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    connect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    update?: QuoteAdjustmentUpdateWithWhereUniqueWithoutPricingOptionInput | QuoteAdjustmentUpdateWithWhereUniqueWithoutPricingOptionInput[]
    updateMany?: QuoteAdjustmentUpdateManyWithWhereWithoutPricingOptionInput | QuoteAdjustmentUpdateManyWithWhereWithoutPricingOptionInput[]
    deleteMany?: QuoteAdjustmentScalarWhereInput | QuoteAdjustmentScalarWhereInput[]
  }

  export type QuoteAdjustmentUncheckedUpdateManyWithoutPricingOptionNestedInput = {
    create?: XOR<QuoteAdjustmentCreateWithoutPricingOptionInput, QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput> | QuoteAdjustmentCreateWithoutPricingOptionInput[] | QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput[]
    connectOrCreate?: QuoteAdjustmentCreateOrConnectWithoutPricingOptionInput | QuoteAdjustmentCreateOrConnectWithoutPricingOptionInput[]
    upsert?: QuoteAdjustmentUpsertWithWhereUniqueWithoutPricingOptionInput | QuoteAdjustmentUpsertWithWhereUniqueWithoutPricingOptionInput[]
    createMany?: QuoteAdjustmentCreateManyPricingOptionInputEnvelope
    set?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    disconnect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    delete?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    connect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    update?: QuoteAdjustmentUpdateWithWhereUniqueWithoutPricingOptionInput | QuoteAdjustmentUpdateWithWhereUniqueWithoutPricingOptionInput[]
    updateMany?: QuoteAdjustmentUpdateManyWithWhereWithoutPricingOptionInput | QuoteAdjustmentUpdateManyWithWhereWithoutPricingOptionInput[]
    deleteMany?: QuoteAdjustmentScalarWhereInput | QuoteAdjustmentScalarWhereInput[]
  }

  export type EnumPricingRuleTypeFieldUpdateOperationsInput = {
    set?: $Enums.PricingRuleType
  }

  export type InquiryCreateNestedOneWithoutQuotesInput = {
    create?: XOR<InquiryCreateWithoutQuotesInput, InquiryUncheckedCreateWithoutQuotesInput>
    connectOrCreate?: InquiryCreateOrConnectWithoutQuotesInput
    connect?: InquiryWhereUniqueInput
  }

  export type QuoteLineItemCreateNestedManyWithoutQuoteInput = {
    create?: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput> | QuoteLineItemCreateWithoutQuoteInput[] | QuoteLineItemUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutQuoteInput | QuoteLineItemCreateOrConnectWithoutQuoteInput[]
    createMany?: QuoteLineItemCreateManyQuoteInputEnvelope
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
  }

  export type QuoteAdjustmentCreateNestedManyWithoutQuoteInput = {
    create?: XOR<QuoteAdjustmentCreateWithoutQuoteInput, QuoteAdjustmentUncheckedCreateWithoutQuoteInput> | QuoteAdjustmentCreateWithoutQuoteInput[] | QuoteAdjustmentUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteAdjustmentCreateOrConnectWithoutQuoteInput | QuoteAdjustmentCreateOrConnectWithoutQuoteInput[]
    createMany?: QuoteAdjustmentCreateManyQuoteInputEnvelope
    connect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
  }

  export type PaymentPlanCreateNestedManyWithoutQuoteInput = {
    create?: XOR<PaymentPlanCreateWithoutQuoteInput, PaymentPlanUncheckedCreateWithoutQuoteInput> | PaymentPlanCreateWithoutQuoteInput[] | PaymentPlanUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: PaymentPlanCreateOrConnectWithoutQuoteInput | PaymentPlanCreateOrConnectWithoutQuoteInput[]
    createMany?: PaymentPlanCreateManyQuoteInputEnvelope
    connect?: PaymentPlanWhereUniqueInput | PaymentPlanWhereUniqueInput[]
  }

  export type ContractDraftCreateNestedOneWithoutQuoteInput = {
    create?: XOR<ContractDraftCreateWithoutQuoteInput, ContractDraftUncheckedCreateWithoutQuoteInput>
    connectOrCreate?: ContractDraftCreateOrConnectWithoutQuoteInput
    connect?: ContractDraftWhereUniqueInput
  }

  export type QuoteLineItemUncheckedCreateNestedManyWithoutQuoteInput = {
    create?: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput> | QuoteLineItemCreateWithoutQuoteInput[] | QuoteLineItemUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutQuoteInput | QuoteLineItemCreateOrConnectWithoutQuoteInput[]
    createMany?: QuoteLineItemCreateManyQuoteInputEnvelope
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
  }

  export type QuoteAdjustmentUncheckedCreateNestedManyWithoutQuoteInput = {
    create?: XOR<QuoteAdjustmentCreateWithoutQuoteInput, QuoteAdjustmentUncheckedCreateWithoutQuoteInput> | QuoteAdjustmentCreateWithoutQuoteInput[] | QuoteAdjustmentUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteAdjustmentCreateOrConnectWithoutQuoteInput | QuoteAdjustmentCreateOrConnectWithoutQuoteInput[]
    createMany?: QuoteAdjustmentCreateManyQuoteInputEnvelope
    connect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
  }

  export type PaymentPlanUncheckedCreateNestedManyWithoutQuoteInput = {
    create?: XOR<PaymentPlanCreateWithoutQuoteInput, PaymentPlanUncheckedCreateWithoutQuoteInput> | PaymentPlanCreateWithoutQuoteInput[] | PaymentPlanUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: PaymentPlanCreateOrConnectWithoutQuoteInput | PaymentPlanCreateOrConnectWithoutQuoteInput[]
    createMany?: PaymentPlanCreateManyQuoteInputEnvelope
    connect?: PaymentPlanWhereUniqueInput | PaymentPlanWhereUniqueInput[]
  }

  export type ContractDraftUncheckedCreateNestedOneWithoutQuoteInput = {
    create?: XOR<ContractDraftCreateWithoutQuoteInput, ContractDraftUncheckedCreateWithoutQuoteInput>
    connectOrCreate?: ContractDraftCreateOrConnectWithoutQuoteInput
    connect?: ContractDraftWhereUniqueInput
  }

  export type EnumQuoteStatusFieldUpdateOperationsInput = {
    set?: $Enums.QuoteStatus
  }

  export type InquiryUpdateOneRequiredWithoutQuotesNestedInput = {
    create?: XOR<InquiryCreateWithoutQuotesInput, InquiryUncheckedCreateWithoutQuotesInput>
    connectOrCreate?: InquiryCreateOrConnectWithoutQuotesInput
    upsert?: InquiryUpsertWithoutQuotesInput
    connect?: InquiryWhereUniqueInput
    update?: XOR<XOR<InquiryUpdateToOneWithWhereWithoutQuotesInput, InquiryUpdateWithoutQuotesInput>, InquiryUncheckedUpdateWithoutQuotesInput>
  }

  export type QuoteLineItemUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput> | QuoteLineItemCreateWithoutQuoteInput[] | QuoteLineItemUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutQuoteInput | QuoteLineItemCreateOrConnectWithoutQuoteInput[]
    upsert?: QuoteLineItemUpsertWithWhereUniqueWithoutQuoteInput | QuoteLineItemUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: QuoteLineItemCreateManyQuoteInputEnvelope
    set?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    disconnect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    delete?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    update?: QuoteLineItemUpdateWithWhereUniqueWithoutQuoteInput | QuoteLineItemUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: QuoteLineItemUpdateManyWithWhereWithoutQuoteInput | QuoteLineItemUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: QuoteLineItemScalarWhereInput | QuoteLineItemScalarWhereInput[]
  }

  export type QuoteAdjustmentUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<QuoteAdjustmentCreateWithoutQuoteInput, QuoteAdjustmentUncheckedCreateWithoutQuoteInput> | QuoteAdjustmentCreateWithoutQuoteInput[] | QuoteAdjustmentUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteAdjustmentCreateOrConnectWithoutQuoteInput | QuoteAdjustmentCreateOrConnectWithoutQuoteInput[]
    upsert?: QuoteAdjustmentUpsertWithWhereUniqueWithoutQuoteInput | QuoteAdjustmentUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: QuoteAdjustmentCreateManyQuoteInputEnvelope
    set?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    disconnect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    delete?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    connect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    update?: QuoteAdjustmentUpdateWithWhereUniqueWithoutQuoteInput | QuoteAdjustmentUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: QuoteAdjustmentUpdateManyWithWhereWithoutQuoteInput | QuoteAdjustmentUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: QuoteAdjustmentScalarWhereInput | QuoteAdjustmentScalarWhereInput[]
  }

  export type PaymentPlanUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<PaymentPlanCreateWithoutQuoteInput, PaymentPlanUncheckedCreateWithoutQuoteInput> | PaymentPlanCreateWithoutQuoteInput[] | PaymentPlanUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: PaymentPlanCreateOrConnectWithoutQuoteInput | PaymentPlanCreateOrConnectWithoutQuoteInput[]
    upsert?: PaymentPlanUpsertWithWhereUniqueWithoutQuoteInput | PaymentPlanUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: PaymentPlanCreateManyQuoteInputEnvelope
    set?: PaymentPlanWhereUniqueInput | PaymentPlanWhereUniqueInput[]
    disconnect?: PaymentPlanWhereUniqueInput | PaymentPlanWhereUniqueInput[]
    delete?: PaymentPlanWhereUniqueInput | PaymentPlanWhereUniqueInput[]
    connect?: PaymentPlanWhereUniqueInput | PaymentPlanWhereUniqueInput[]
    update?: PaymentPlanUpdateWithWhereUniqueWithoutQuoteInput | PaymentPlanUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: PaymentPlanUpdateManyWithWhereWithoutQuoteInput | PaymentPlanUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: PaymentPlanScalarWhereInput | PaymentPlanScalarWhereInput[]
  }

  export type ContractDraftUpdateOneWithoutQuoteNestedInput = {
    create?: XOR<ContractDraftCreateWithoutQuoteInput, ContractDraftUncheckedCreateWithoutQuoteInput>
    connectOrCreate?: ContractDraftCreateOrConnectWithoutQuoteInput
    upsert?: ContractDraftUpsertWithoutQuoteInput
    disconnect?: ContractDraftWhereInput | boolean
    delete?: ContractDraftWhereInput | boolean
    connect?: ContractDraftWhereUniqueInput
    update?: XOR<XOR<ContractDraftUpdateToOneWithWhereWithoutQuoteInput, ContractDraftUpdateWithoutQuoteInput>, ContractDraftUncheckedUpdateWithoutQuoteInput>
  }

  export type QuoteLineItemUncheckedUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput> | QuoteLineItemCreateWithoutQuoteInput[] | QuoteLineItemUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteLineItemCreateOrConnectWithoutQuoteInput | QuoteLineItemCreateOrConnectWithoutQuoteInput[]
    upsert?: QuoteLineItemUpsertWithWhereUniqueWithoutQuoteInput | QuoteLineItemUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: QuoteLineItemCreateManyQuoteInputEnvelope
    set?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    disconnect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    delete?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    connect?: QuoteLineItemWhereUniqueInput | QuoteLineItemWhereUniqueInput[]
    update?: QuoteLineItemUpdateWithWhereUniqueWithoutQuoteInput | QuoteLineItemUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: QuoteLineItemUpdateManyWithWhereWithoutQuoteInput | QuoteLineItemUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: QuoteLineItemScalarWhereInput | QuoteLineItemScalarWhereInput[]
  }

  export type QuoteAdjustmentUncheckedUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<QuoteAdjustmentCreateWithoutQuoteInput, QuoteAdjustmentUncheckedCreateWithoutQuoteInput> | QuoteAdjustmentCreateWithoutQuoteInput[] | QuoteAdjustmentUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: QuoteAdjustmentCreateOrConnectWithoutQuoteInput | QuoteAdjustmentCreateOrConnectWithoutQuoteInput[]
    upsert?: QuoteAdjustmentUpsertWithWhereUniqueWithoutQuoteInput | QuoteAdjustmentUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: QuoteAdjustmentCreateManyQuoteInputEnvelope
    set?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    disconnect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    delete?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    connect?: QuoteAdjustmentWhereUniqueInput | QuoteAdjustmentWhereUniqueInput[]
    update?: QuoteAdjustmentUpdateWithWhereUniqueWithoutQuoteInput | QuoteAdjustmentUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: QuoteAdjustmentUpdateManyWithWhereWithoutQuoteInput | QuoteAdjustmentUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: QuoteAdjustmentScalarWhereInput | QuoteAdjustmentScalarWhereInput[]
  }

  export type PaymentPlanUncheckedUpdateManyWithoutQuoteNestedInput = {
    create?: XOR<PaymentPlanCreateWithoutQuoteInput, PaymentPlanUncheckedCreateWithoutQuoteInput> | PaymentPlanCreateWithoutQuoteInput[] | PaymentPlanUncheckedCreateWithoutQuoteInput[]
    connectOrCreate?: PaymentPlanCreateOrConnectWithoutQuoteInput | PaymentPlanCreateOrConnectWithoutQuoteInput[]
    upsert?: PaymentPlanUpsertWithWhereUniqueWithoutQuoteInput | PaymentPlanUpsertWithWhereUniqueWithoutQuoteInput[]
    createMany?: PaymentPlanCreateManyQuoteInputEnvelope
    set?: PaymentPlanWhereUniqueInput | PaymentPlanWhereUniqueInput[]
    disconnect?: PaymentPlanWhereUniqueInput | PaymentPlanWhereUniqueInput[]
    delete?: PaymentPlanWhereUniqueInput | PaymentPlanWhereUniqueInput[]
    connect?: PaymentPlanWhereUniqueInput | PaymentPlanWhereUniqueInput[]
    update?: PaymentPlanUpdateWithWhereUniqueWithoutQuoteInput | PaymentPlanUpdateWithWhereUniqueWithoutQuoteInput[]
    updateMany?: PaymentPlanUpdateManyWithWhereWithoutQuoteInput | PaymentPlanUpdateManyWithWhereWithoutQuoteInput[]
    deleteMany?: PaymentPlanScalarWhereInput | PaymentPlanScalarWhereInput[]
  }

  export type ContractDraftUncheckedUpdateOneWithoutQuoteNestedInput = {
    create?: XOR<ContractDraftCreateWithoutQuoteInput, ContractDraftUncheckedCreateWithoutQuoteInput>
    connectOrCreate?: ContractDraftCreateOrConnectWithoutQuoteInput
    upsert?: ContractDraftUpsertWithoutQuoteInput
    disconnect?: ContractDraftWhereInput | boolean
    delete?: ContractDraftWhereInput | boolean
    connect?: ContractDraftWhereUniqueInput
    update?: XOR<XOR<ContractDraftUpdateToOneWithWhereWithoutQuoteInput, ContractDraftUpdateWithoutQuoteInput>, ContractDraftUncheckedUpdateWithoutQuoteInput>
  }

  export type QuoteCreateNestedOneWithoutLineItemsInput = {
    create?: XOR<QuoteCreateWithoutLineItemsInput, QuoteUncheckedCreateWithoutLineItemsInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutLineItemsInput
    connect?: QuoteWhereUniqueInput
  }

  export type ServiceTypeCreateNestedOneWithoutQuoteLineItemsInput = {
    create?: XOR<ServiceTypeCreateWithoutQuoteLineItemsInput, ServiceTypeUncheckedCreateWithoutQuoteLineItemsInput>
    connectOrCreate?: ServiceTypeCreateOrConnectWithoutQuoteLineItemsInput
    connect?: ServiceTypeWhereUniqueInput
  }

  export type EnumQuoteLineKindFieldUpdateOperationsInput = {
    set?: $Enums.QuoteLineKind
  }

  export type QuoteUpdateOneRequiredWithoutLineItemsNestedInput = {
    create?: XOR<QuoteCreateWithoutLineItemsInput, QuoteUncheckedCreateWithoutLineItemsInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutLineItemsInput
    upsert?: QuoteUpsertWithoutLineItemsInput
    connect?: QuoteWhereUniqueInput
    update?: XOR<XOR<QuoteUpdateToOneWithWhereWithoutLineItemsInput, QuoteUpdateWithoutLineItemsInput>, QuoteUncheckedUpdateWithoutLineItemsInput>
  }

  export type ServiceTypeUpdateOneWithoutQuoteLineItemsNestedInput = {
    create?: XOR<ServiceTypeCreateWithoutQuoteLineItemsInput, ServiceTypeUncheckedCreateWithoutQuoteLineItemsInput>
    connectOrCreate?: ServiceTypeCreateOrConnectWithoutQuoteLineItemsInput
    upsert?: ServiceTypeUpsertWithoutQuoteLineItemsInput
    disconnect?: ServiceTypeWhereInput | boolean
    delete?: ServiceTypeWhereInput | boolean
    connect?: ServiceTypeWhereUniqueInput
    update?: XOR<XOR<ServiceTypeUpdateToOneWithWhereWithoutQuoteLineItemsInput, ServiceTypeUpdateWithoutQuoteLineItemsInput>, ServiceTypeUncheckedUpdateWithoutQuoteLineItemsInput>
  }

  export type QuoteCreateNestedOneWithoutAdjustmentsInput = {
    create?: XOR<QuoteCreateWithoutAdjustmentsInput, QuoteUncheckedCreateWithoutAdjustmentsInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutAdjustmentsInput
    connect?: QuoteWhereUniqueInput
  }

  export type PricingOptionCreateNestedOneWithoutQuoteAdjustmentsInput = {
    create?: XOR<PricingOptionCreateWithoutQuoteAdjustmentsInput, PricingOptionUncheckedCreateWithoutQuoteAdjustmentsInput>
    connectOrCreate?: PricingOptionCreateOrConnectWithoutQuoteAdjustmentsInput
    connect?: PricingOptionWhereUniqueInput
  }

  export type QuoteUpdateOneRequiredWithoutAdjustmentsNestedInput = {
    create?: XOR<QuoteCreateWithoutAdjustmentsInput, QuoteUncheckedCreateWithoutAdjustmentsInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutAdjustmentsInput
    upsert?: QuoteUpsertWithoutAdjustmentsInput
    connect?: QuoteWhereUniqueInput
    update?: XOR<XOR<QuoteUpdateToOneWithWhereWithoutAdjustmentsInput, QuoteUpdateWithoutAdjustmentsInput>, QuoteUncheckedUpdateWithoutAdjustmentsInput>
  }

  export type PricingOptionUpdateOneWithoutQuoteAdjustmentsNestedInput = {
    create?: XOR<PricingOptionCreateWithoutQuoteAdjustmentsInput, PricingOptionUncheckedCreateWithoutQuoteAdjustmentsInput>
    connectOrCreate?: PricingOptionCreateOrConnectWithoutQuoteAdjustmentsInput
    upsert?: PricingOptionUpsertWithoutQuoteAdjustmentsInput
    disconnect?: PricingOptionWhereInput | boolean
    delete?: PricingOptionWhereInput | boolean
    connect?: PricingOptionWhereUniqueInput
    update?: XOR<XOR<PricingOptionUpdateToOneWithWhereWithoutQuoteAdjustmentsInput, PricingOptionUpdateWithoutQuoteAdjustmentsInput>, PricingOptionUncheckedUpdateWithoutQuoteAdjustmentsInput>
  }

  export type QuoteCreateNestedOneWithoutPaymentPlansInput = {
    create?: XOR<QuoteCreateWithoutPaymentPlansInput, QuoteUncheckedCreateWithoutPaymentPlansInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutPaymentPlansInput
    connect?: QuoteWhereUniqueInput
  }

  export type EnumPaymentStageKindFieldUpdateOperationsInput = {
    set?: $Enums.PaymentStageKind
  }

  export type QuoteUpdateOneRequiredWithoutPaymentPlansNestedInput = {
    create?: XOR<QuoteCreateWithoutPaymentPlansInput, QuoteUncheckedCreateWithoutPaymentPlansInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutPaymentPlansInput
    upsert?: QuoteUpsertWithoutPaymentPlansInput
    connect?: QuoteWhereUniqueInput
    update?: XOR<XOR<QuoteUpdateToOneWithWhereWithoutPaymentPlansInput, QuoteUpdateWithoutPaymentPlansInput>, QuoteUncheckedUpdateWithoutPaymentPlansInput>
  }

  export type InquiryCreateNestedOneWithoutContractDraftsInput = {
    create?: XOR<InquiryCreateWithoutContractDraftsInput, InquiryUncheckedCreateWithoutContractDraftsInput>
    connectOrCreate?: InquiryCreateOrConnectWithoutContractDraftsInput
    connect?: InquiryWhereUniqueInput
  }

  export type QuoteCreateNestedOneWithoutContractDraftInput = {
    create?: XOR<QuoteCreateWithoutContractDraftInput, QuoteUncheckedCreateWithoutContractDraftInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutContractDraftInput
    connect?: QuoteWhereUniqueInput
  }

  export type EnumContractDraftStatusFieldUpdateOperationsInput = {
    set?: $Enums.ContractDraftStatus
  }

  export type InquiryUpdateOneRequiredWithoutContractDraftsNestedInput = {
    create?: XOR<InquiryCreateWithoutContractDraftsInput, InquiryUncheckedCreateWithoutContractDraftsInput>
    connectOrCreate?: InquiryCreateOrConnectWithoutContractDraftsInput
    upsert?: InquiryUpsertWithoutContractDraftsInput
    connect?: InquiryWhereUniqueInput
    update?: XOR<XOR<InquiryUpdateToOneWithWhereWithoutContractDraftsInput, InquiryUpdateWithoutContractDraftsInput>, InquiryUncheckedUpdateWithoutContractDraftsInput>
  }

  export type QuoteUpdateOneRequiredWithoutContractDraftNestedInput = {
    create?: XOR<QuoteCreateWithoutContractDraftInput, QuoteUncheckedCreateWithoutContractDraftInput>
    connectOrCreate?: QuoteCreateOrConnectWithoutContractDraftInput
    upsert?: QuoteUpsertWithoutContractDraftInput
    connect?: QuoteWhereUniqueInput
    update?: XOR<XOR<QuoteUpdateToOneWithWhereWithoutContractDraftInput, QuoteUpdateWithoutContractDraftInput>, QuoteUncheckedUpdateWithoutContractDraftInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedEnumInquiryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.InquiryStatus | EnumInquiryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InquiryStatus[]
    notIn?: $Enums.InquiryStatus[]
    not?: NestedEnumInquiryStatusFilter<$PrismaModel> | $Enums.InquiryStatus
  }

  export type NestedEnumInquiryTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.InquiryType | EnumInquiryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InquiryType[]
    notIn?: $Enums.InquiryType[]
    not?: NestedEnumInquiryTypeFilter<$PrismaModel> | $Enums.InquiryType
  }

  export type NestedEnumUrgencyLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.UrgencyLevel | EnumUrgencyLevelFieldRefInput<$PrismaModel>
    in?: $Enums.UrgencyLevel[]
    notIn?: $Enums.UrgencyLevel[]
    not?: NestedEnumUrgencyLevelFilter<$PrismaModel> | $Enums.UrgencyLevel
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedEnumLanguageCodeFilter<$PrismaModel = never> = {
    equals?: $Enums.LanguageCode | EnumLanguageCodeFieldRefInput<$PrismaModel>
    in?: $Enums.LanguageCode[]
    notIn?: $Enums.LanguageCode[]
    not?: NestedEnumLanguageCodeFilter<$PrismaModel> | $Enums.LanguageCode
  }

  export type NestedEnumClientTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.ClientType | EnumClientTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ClientType[]
    notIn?: $Enums.ClientType[]
    not?: NestedEnumClientTypeFilter<$PrismaModel> | $Enums.ClientType
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumInquiryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InquiryStatus | EnumInquiryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.InquiryStatus[]
    notIn?: $Enums.InquiryStatus[]
    not?: NestedEnumInquiryStatusWithAggregatesFilter<$PrismaModel> | $Enums.InquiryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInquiryStatusFilter<$PrismaModel>
    _max?: NestedEnumInquiryStatusFilter<$PrismaModel>
  }

  export type NestedEnumInquiryTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.InquiryType | EnumInquiryTypeFieldRefInput<$PrismaModel>
    in?: $Enums.InquiryType[]
    notIn?: $Enums.InquiryType[]
    not?: NestedEnumInquiryTypeWithAggregatesFilter<$PrismaModel> | $Enums.InquiryType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumInquiryTypeFilter<$PrismaModel>
    _max?: NestedEnumInquiryTypeFilter<$PrismaModel>
  }

  export type NestedEnumUrgencyLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UrgencyLevel | EnumUrgencyLevelFieldRefInput<$PrismaModel>
    in?: $Enums.UrgencyLevel[]
    notIn?: $Enums.UrgencyLevel[]
    not?: NestedEnumUrgencyLevelWithAggregatesFilter<$PrismaModel> | $Enums.UrgencyLevel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUrgencyLevelFilter<$PrismaModel>
    _max?: NestedEnumUrgencyLevelFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedEnumLanguageCodeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LanguageCode | EnumLanguageCodeFieldRefInput<$PrismaModel>
    in?: $Enums.LanguageCode[]
    notIn?: $Enums.LanguageCode[]
    not?: NestedEnumLanguageCodeWithAggregatesFilter<$PrismaModel> | $Enums.LanguageCode
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLanguageCodeFilter<$PrismaModel>
    _max?: NestedEnumLanguageCodeFilter<$PrismaModel>
  }

  export type NestedEnumClientTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ClientType | EnumClientTypeFieldRefInput<$PrismaModel>
    in?: $Enums.ClientType[]
    notIn?: $Enums.ClientType[]
    not?: NestedEnumClientTypeWithAggregatesFilter<$PrismaModel> | $Enums.ClientType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumClientTypeFilter<$PrismaModel>
    _max?: NestedEnumClientTypeFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumPricingOptionTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingOptionType | EnumPricingOptionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingOptionType[]
    notIn?: $Enums.PricingOptionType[]
    not?: NestedEnumPricingOptionTypeFilter<$PrismaModel> | $Enums.PricingOptionType
  }

  export type NestedEnumPricingOptionTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingOptionType | EnumPricingOptionTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingOptionType[]
    notIn?: $Enums.PricingOptionType[]
    not?: NestedEnumPricingOptionTypeWithAggregatesFilter<$PrismaModel> | $Enums.PricingOptionType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPricingOptionTypeFilter<$PrismaModel>
    _max?: NestedEnumPricingOptionTypeFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumPricingRuleTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingRuleType | EnumPricingRuleTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingRuleType[]
    notIn?: $Enums.PricingRuleType[]
    not?: NestedEnumPricingRuleTypeFilter<$PrismaModel> | $Enums.PricingRuleType
  }

  export type NestedEnumPricingRuleTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingRuleType | EnumPricingRuleTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingRuleType[]
    notIn?: $Enums.PricingRuleType[]
    not?: NestedEnumPricingRuleTypeWithAggregatesFilter<$PrismaModel> | $Enums.PricingRuleType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPricingRuleTypeFilter<$PrismaModel>
    _max?: NestedEnumPricingRuleTypeFilter<$PrismaModel>
  }

  export type NestedEnumQuoteStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteStatus | EnumQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteStatus[]
    notIn?: $Enums.QuoteStatus[]
    not?: NestedEnumQuoteStatusFilter<$PrismaModel> | $Enums.QuoteStatus
  }

  export type NestedEnumQuoteStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteStatus | EnumQuoteStatusFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteStatus[]
    notIn?: $Enums.QuoteStatus[]
    not?: NestedEnumQuoteStatusWithAggregatesFilter<$PrismaModel> | $Enums.QuoteStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuoteStatusFilter<$PrismaModel>
    _max?: NestedEnumQuoteStatusFilter<$PrismaModel>
  }

  export type NestedEnumQuoteLineKindFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteLineKind | EnumQuoteLineKindFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteLineKind[]
    notIn?: $Enums.QuoteLineKind[]
    not?: NestedEnumQuoteLineKindFilter<$PrismaModel> | $Enums.QuoteLineKind
  }

  export type NestedEnumQuoteLineKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.QuoteLineKind | EnumQuoteLineKindFieldRefInput<$PrismaModel>
    in?: $Enums.QuoteLineKind[]
    notIn?: $Enums.QuoteLineKind[]
    not?: NestedEnumQuoteLineKindWithAggregatesFilter<$PrismaModel> | $Enums.QuoteLineKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumQuoteLineKindFilter<$PrismaModel>
    _max?: NestedEnumQuoteLineKindFilter<$PrismaModel>
  }

  export type NestedEnumPaymentStageKindFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStageKind | EnumPaymentStageKindFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStageKind[]
    notIn?: $Enums.PaymentStageKind[]
    not?: NestedEnumPaymentStageKindFilter<$PrismaModel> | $Enums.PaymentStageKind
  }

  export type NestedEnumPaymentStageKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStageKind | EnumPaymentStageKindFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStageKind[]
    notIn?: $Enums.PaymentStageKind[]
    not?: NestedEnumPaymentStageKindWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStageKind
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStageKindFilter<$PrismaModel>
    _max?: NestedEnumPaymentStageKindFilter<$PrismaModel>
  }

  export type NestedEnumContractDraftStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ContractDraftStatus | EnumContractDraftStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ContractDraftStatus[]
    notIn?: $Enums.ContractDraftStatus[]
    not?: NestedEnumContractDraftStatusFilter<$PrismaModel> | $Enums.ContractDraftStatus
  }

  export type NestedEnumContractDraftStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ContractDraftStatus | EnumContractDraftStatusFieldRefInput<$PrismaModel>
    in?: $Enums.ContractDraftStatus[]
    notIn?: $Enums.ContractDraftStatus[]
    not?: NestedEnumContractDraftStatusWithAggregatesFilter<$PrismaModel> | $Enums.ContractDraftStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumContractDraftStatusFilter<$PrismaModel>
    _max?: NestedEnumContractDraftStatusFilter<$PrismaModel>
  }

  export type QuoteCreateWithoutInquiryInput = {
    id?: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: QuoteLineItemCreateNestedManyWithoutQuoteInput
    adjustments?: QuoteAdjustmentCreateNestedManyWithoutQuoteInput
    paymentPlans?: PaymentPlanCreateNestedManyWithoutQuoteInput
    contractDraft?: ContractDraftCreateNestedOneWithoutQuoteInput
  }

  export type QuoteUncheckedCreateWithoutInquiryInput = {
    id?: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: QuoteLineItemUncheckedCreateNestedManyWithoutQuoteInput
    adjustments?: QuoteAdjustmentUncheckedCreateNestedManyWithoutQuoteInput
    paymentPlans?: PaymentPlanUncheckedCreateNestedManyWithoutQuoteInput
    contractDraft?: ContractDraftUncheckedCreateNestedOneWithoutQuoteInput
  }

  export type QuoteCreateOrConnectWithoutInquiryInput = {
    where: QuoteWhereUniqueInput
    create: XOR<QuoteCreateWithoutInquiryInput, QuoteUncheckedCreateWithoutInquiryInput>
  }

  export type QuoteCreateManyInquiryInputEnvelope = {
    data: QuoteCreateManyInquiryInput | QuoteCreateManyInquiryInput[]
  }

  export type ContractDraftCreateWithoutInquiryInput = {
    id?: string
    status?: $Enums.ContractDraftStatus
    title: string
    bodyText: string
    scopeText?: string | null
    paymentSummary?: string | null
    successFeeRestricted?: boolean
    specialTerms?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    quote: QuoteCreateNestedOneWithoutContractDraftInput
  }

  export type ContractDraftUncheckedCreateWithoutInquiryInput = {
    id?: string
    quoteId: string
    status?: $Enums.ContractDraftStatus
    title: string
    bodyText: string
    scopeText?: string | null
    paymentSummary?: string | null
    successFeeRestricted?: boolean
    specialTerms?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContractDraftCreateOrConnectWithoutInquiryInput = {
    where: ContractDraftWhereUniqueInput
    create: XOR<ContractDraftCreateWithoutInquiryInput, ContractDraftUncheckedCreateWithoutInquiryInput>
  }

  export type ContractDraftCreateManyInquiryInputEnvelope = {
    data: ContractDraftCreateManyInquiryInput | ContractDraftCreateManyInquiryInput[]
  }

  export type QuoteUpsertWithWhereUniqueWithoutInquiryInput = {
    where: QuoteWhereUniqueInput
    update: XOR<QuoteUpdateWithoutInquiryInput, QuoteUncheckedUpdateWithoutInquiryInput>
    create: XOR<QuoteCreateWithoutInquiryInput, QuoteUncheckedCreateWithoutInquiryInput>
  }

  export type QuoteUpdateWithWhereUniqueWithoutInquiryInput = {
    where: QuoteWhereUniqueInput
    data: XOR<QuoteUpdateWithoutInquiryInput, QuoteUncheckedUpdateWithoutInquiryInput>
  }

  export type QuoteUpdateManyWithWhereWithoutInquiryInput = {
    where: QuoteScalarWhereInput
    data: XOR<QuoteUpdateManyMutationInput, QuoteUncheckedUpdateManyWithoutInquiryInput>
  }

  export type QuoteScalarWhereInput = {
    AND?: QuoteScalarWhereInput | QuoteScalarWhereInput[]
    OR?: QuoteScalarWhereInput[]
    NOT?: QuoteScalarWhereInput | QuoteScalarWhereInput[]
    id?: StringFilter<"Quote"> | string
    inquiryId?: StringFilter<"Quote"> | string
    status?: EnumQuoteStatusFilter<"Quote"> | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFilter<"Quote"> | string
    selectedOptionLegacyIds?: StringFilter<"Quote"> | string
    urgencyRuleCode?: StringFilter<"Quote"> | string
    consultRuleCode?: StringFilter<"Quote"> | string
    paymentRuleCode?: StringFilter<"Quote"> | string
    rangeMode?: BoolFilter<"Quote"> | boolean
    serviceBaseMin?: IntFilter<"Quote"> | number
    serviceBaseMax?: IntFilter<"Quote"> | number
    subtotalMin?: IntFilter<"Quote"> | number
    subtotalMax?: IntFilter<"Quote"> | number
    vatAmountMin?: IntFilter<"Quote"> | number
    vatAmountMax?: IntFilter<"Quote"> | number
    totalMin?: IntFilter<"Quote"> | number
    totalMax?: IntFilter<"Quote"> | number
    consultFee?: IntFilter<"Quote"> | number
    successFeeRestricted?: BoolFilter<"Quote"> | boolean
    draftNotes?: StringNullableFilter<"Quote"> | string | null
    calculationSummary?: StringNullableFilter<"Quote"> | string | null
    createdAt?: DateTimeFilter<"Quote"> | Date | string
    updatedAt?: DateTimeFilter<"Quote"> | Date | string
  }

  export type ContractDraftUpsertWithWhereUniqueWithoutInquiryInput = {
    where: ContractDraftWhereUniqueInput
    update: XOR<ContractDraftUpdateWithoutInquiryInput, ContractDraftUncheckedUpdateWithoutInquiryInput>
    create: XOR<ContractDraftCreateWithoutInquiryInput, ContractDraftUncheckedCreateWithoutInquiryInput>
  }

  export type ContractDraftUpdateWithWhereUniqueWithoutInquiryInput = {
    where: ContractDraftWhereUniqueInput
    data: XOR<ContractDraftUpdateWithoutInquiryInput, ContractDraftUncheckedUpdateWithoutInquiryInput>
  }

  export type ContractDraftUpdateManyWithWhereWithoutInquiryInput = {
    where: ContractDraftScalarWhereInput
    data: XOR<ContractDraftUpdateManyMutationInput, ContractDraftUncheckedUpdateManyWithoutInquiryInput>
  }

  export type ContractDraftScalarWhereInput = {
    AND?: ContractDraftScalarWhereInput | ContractDraftScalarWhereInput[]
    OR?: ContractDraftScalarWhereInput[]
    NOT?: ContractDraftScalarWhereInput | ContractDraftScalarWhereInput[]
    id?: StringFilter<"ContractDraft"> | string
    inquiryId?: StringFilter<"ContractDraft"> | string
    quoteId?: StringFilter<"ContractDraft"> | string
    status?: EnumContractDraftStatusFilter<"ContractDraft"> | $Enums.ContractDraftStatus
    title?: StringFilter<"ContractDraft"> | string
    bodyText?: StringFilter<"ContractDraft"> | string
    scopeText?: StringNullableFilter<"ContractDraft"> | string | null
    paymentSummary?: StringNullableFilter<"ContractDraft"> | string | null
    successFeeRestricted?: BoolFilter<"ContractDraft"> | boolean
    specialTerms?: StringNullableFilter<"ContractDraft"> | string | null
    createdAt?: DateTimeFilter<"ContractDraft"> | Date | string
    updatedAt?: DateTimeFilter<"ContractDraft"> | Date | string
  }

  export type QuoteLineItemCreateWithoutServiceTypeInput = {
    id?: string
    kind: $Enums.QuoteLineKind
    label: string
    description?: string | null
    amountMin: number
    amountMax: number
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    quote: QuoteCreateNestedOneWithoutLineItemsInput
  }

  export type QuoteLineItemUncheckedCreateWithoutServiceTypeInput = {
    id?: string
    quoteId: string
    kind: $Enums.QuoteLineKind
    label: string
    description?: string | null
    amountMin: number
    amountMax: number
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteLineItemCreateOrConnectWithoutServiceTypeInput = {
    where: QuoteLineItemWhereUniqueInput
    create: XOR<QuoteLineItemCreateWithoutServiceTypeInput, QuoteLineItemUncheckedCreateWithoutServiceTypeInput>
  }

  export type QuoteLineItemCreateManyServiceTypeInputEnvelope = {
    data: QuoteLineItemCreateManyServiceTypeInput | QuoteLineItemCreateManyServiceTypeInput[]
  }

  export type QuoteLineItemUpsertWithWhereUniqueWithoutServiceTypeInput = {
    where: QuoteLineItemWhereUniqueInput
    update: XOR<QuoteLineItemUpdateWithoutServiceTypeInput, QuoteLineItemUncheckedUpdateWithoutServiceTypeInput>
    create: XOR<QuoteLineItemCreateWithoutServiceTypeInput, QuoteLineItemUncheckedCreateWithoutServiceTypeInput>
  }

  export type QuoteLineItemUpdateWithWhereUniqueWithoutServiceTypeInput = {
    where: QuoteLineItemWhereUniqueInput
    data: XOR<QuoteLineItemUpdateWithoutServiceTypeInput, QuoteLineItemUncheckedUpdateWithoutServiceTypeInput>
  }

  export type QuoteLineItemUpdateManyWithWhereWithoutServiceTypeInput = {
    where: QuoteLineItemScalarWhereInput
    data: XOR<QuoteLineItemUpdateManyMutationInput, QuoteLineItemUncheckedUpdateManyWithoutServiceTypeInput>
  }

  export type QuoteLineItemScalarWhereInput = {
    AND?: QuoteLineItemScalarWhereInput | QuoteLineItemScalarWhereInput[]
    OR?: QuoteLineItemScalarWhereInput[]
    NOT?: QuoteLineItemScalarWhereInput | QuoteLineItemScalarWhereInput[]
    id?: StringFilter<"QuoteLineItem"> | string
    quoteId?: StringFilter<"QuoteLineItem"> | string
    serviceTypeId?: StringNullableFilter<"QuoteLineItem"> | string | null
    kind?: EnumQuoteLineKindFilter<"QuoteLineItem"> | $Enums.QuoteLineKind
    label?: StringFilter<"QuoteLineItem"> | string
    description?: StringNullableFilter<"QuoteLineItem"> | string | null
    amountMin?: IntFilter<"QuoteLineItem"> | number
    amountMax?: IntFilter<"QuoteLineItem"> | number
    sortOrder?: IntFilter<"QuoteLineItem"> | number
    isManual?: BoolFilter<"QuoteLineItem"> | boolean
    createdAt?: DateTimeFilter<"QuoteLineItem"> | Date | string
    updatedAt?: DateTimeFilter<"QuoteLineItem"> | Date | string
  }

  export type QuoteAdjustmentCreateWithoutPricingOptionInput = {
    id?: string
    label: string
    description?: string | null
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    computedMin: number
    computedMax: number
    isVat?: boolean
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    quote: QuoteCreateNestedOneWithoutAdjustmentsInput
  }

  export type QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput = {
    id?: string
    quoteId: string
    label: string
    description?: string | null
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    computedMin: number
    computedMax: number
    isVat?: boolean
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteAdjustmentCreateOrConnectWithoutPricingOptionInput = {
    where: QuoteAdjustmentWhereUniqueInput
    create: XOR<QuoteAdjustmentCreateWithoutPricingOptionInput, QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput>
  }

  export type QuoteAdjustmentCreateManyPricingOptionInputEnvelope = {
    data: QuoteAdjustmentCreateManyPricingOptionInput | QuoteAdjustmentCreateManyPricingOptionInput[]
  }

  export type QuoteAdjustmentUpsertWithWhereUniqueWithoutPricingOptionInput = {
    where: QuoteAdjustmentWhereUniqueInput
    update: XOR<QuoteAdjustmentUpdateWithoutPricingOptionInput, QuoteAdjustmentUncheckedUpdateWithoutPricingOptionInput>
    create: XOR<QuoteAdjustmentCreateWithoutPricingOptionInput, QuoteAdjustmentUncheckedCreateWithoutPricingOptionInput>
  }

  export type QuoteAdjustmentUpdateWithWhereUniqueWithoutPricingOptionInput = {
    where: QuoteAdjustmentWhereUniqueInput
    data: XOR<QuoteAdjustmentUpdateWithoutPricingOptionInput, QuoteAdjustmentUncheckedUpdateWithoutPricingOptionInput>
  }

  export type QuoteAdjustmentUpdateManyWithWhereWithoutPricingOptionInput = {
    where: QuoteAdjustmentScalarWhereInput
    data: XOR<QuoteAdjustmentUpdateManyMutationInput, QuoteAdjustmentUncheckedUpdateManyWithoutPricingOptionInput>
  }

  export type QuoteAdjustmentScalarWhereInput = {
    AND?: QuoteAdjustmentScalarWhereInput | QuoteAdjustmentScalarWhereInput[]
    OR?: QuoteAdjustmentScalarWhereInput[]
    NOT?: QuoteAdjustmentScalarWhereInput | QuoteAdjustmentScalarWhereInput[]
    id?: StringFilter<"QuoteAdjustment"> | string
    quoteId?: StringFilter<"QuoteAdjustment"> | string
    pricingOptionId?: StringNullableFilter<"QuoteAdjustment"> | string | null
    label?: StringFilter<"QuoteAdjustment"> | string
    description?: StringNullableFilter<"QuoteAdjustment"> | string | null
    optionType?: EnumPricingOptionTypeFilter<"QuoteAdjustment"> | $Enums.PricingOptionType
    flatAmount?: IntNullableFilter<"QuoteAdjustment"> | number | null
    percentRate?: IntNullableFilter<"QuoteAdjustment"> | number | null
    computedMin?: IntFilter<"QuoteAdjustment"> | number
    computedMax?: IntFilter<"QuoteAdjustment"> | number
    isVat?: BoolFilter<"QuoteAdjustment"> | boolean
    sortOrder?: IntFilter<"QuoteAdjustment"> | number
    isManual?: BoolFilter<"QuoteAdjustment"> | boolean
    createdAt?: DateTimeFilter<"QuoteAdjustment"> | Date | string
    updatedAt?: DateTimeFilter<"QuoteAdjustment"> | Date | string
  }

  export type InquiryCreateWithoutQuotesInput = {
    id?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    status?: $Enums.InquiryStatus
    inquiryType?: $Enums.InquiryType
    urgencyLevel?: $Enums.UrgencyLevel
    classificationConfidence?: number
    qualificationScore?: number
    preferredLanguage?: $Enums.LanguageCode
    clientType?: $Enums.ClientType
    contactName: string
    organizationName?: string | null
    email: string
    phone?: string | null
    title: string
    description: string
    nationality?: string | null
    currentStatus?: string | null
    documentCountry?: string | null
    targetAgency?: string | null
    dueDate?: Date | string | null
    assignee?: string | null
    internalMemo?: string | null
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: string
    generatedSummary: string
    generatedGuidance: string
    generatedReceiptMessage: string
    classificationReason: string
    recommendedNextStep: string
    serviceTags?: string
    contractDrafts?: ContractDraftCreateNestedManyWithoutInquiryInput
  }

  export type InquiryUncheckedCreateWithoutQuotesInput = {
    id?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    status?: $Enums.InquiryStatus
    inquiryType?: $Enums.InquiryType
    urgencyLevel?: $Enums.UrgencyLevel
    classificationConfidence?: number
    qualificationScore?: number
    preferredLanguage?: $Enums.LanguageCode
    clientType?: $Enums.ClientType
    contactName: string
    organizationName?: string | null
    email: string
    phone?: string | null
    title: string
    description: string
    nationality?: string | null
    currentStatus?: string | null
    documentCountry?: string | null
    targetAgency?: string | null
    dueDate?: Date | string | null
    assignee?: string | null
    internalMemo?: string | null
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: string
    generatedSummary: string
    generatedGuidance: string
    generatedReceiptMessage: string
    classificationReason: string
    recommendedNextStep: string
    serviceTags?: string
    contractDrafts?: ContractDraftUncheckedCreateNestedManyWithoutInquiryInput
  }

  export type InquiryCreateOrConnectWithoutQuotesInput = {
    where: InquiryWhereUniqueInput
    create: XOR<InquiryCreateWithoutQuotesInput, InquiryUncheckedCreateWithoutQuotesInput>
  }

  export type QuoteLineItemCreateWithoutQuoteInput = {
    id?: string
    kind: $Enums.QuoteLineKind
    label: string
    description?: string | null
    amountMin: number
    amountMax: number
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    serviceType?: ServiceTypeCreateNestedOneWithoutQuoteLineItemsInput
  }

  export type QuoteLineItemUncheckedCreateWithoutQuoteInput = {
    id?: string
    serviceTypeId?: string | null
    kind: $Enums.QuoteLineKind
    label: string
    description?: string | null
    amountMin: number
    amountMax: number
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteLineItemCreateOrConnectWithoutQuoteInput = {
    where: QuoteLineItemWhereUniqueInput
    create: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput>
  }

  export type QuoteLineItemCreateManyQuoteInputEnvelope = {
    data: QuoteLineItemCreateManyQuoteInput | QuoteLineItemCreateManyQuoteInput[]
  }

  export type QuoteAdjustmentCreateWithoutQuoteInput = {
    id?: string
    label: string
    description?: string | null
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    computedMin: number
    computedMax: number
    isVat?: boolean
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    pricingOption?: PricingOptionCreateNestedOneWithoutQuoteAdjustmentsInput
  }

  export type QuoteAdjustmentUncheckedCreateWithoutQuoteInput = {
    id?: string
    pricingOptionId?: string | null
    label: string
    description?: string | null
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    computedMin: number
    computedMax: number
    isVat?: boolean
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteAdjustmentCreateOrConnectWithoutQuoteInput = {
    where: QuoteAdjustmentWhereUniqueInput
    create: XOR<QuoteAdjustmentCreateWithoutQuoteInput, QuoteAdjustmentUncheckedCreateWithoutQuoteInput>
  }

  export type QuoteAdjustmentCreateManyQuoteInputEnvelope = {
    data: QuoteAdjustmentCreateManyQuoteInput | QuoteAdjustmentCreateManyQuoteInput[]
  }

  export type PaymentPlanCreateWithoutQuoteInput = {
    id?: string
    stageKind: $Enums.PaymentStageKind
    percentage: number
    dueText: string
    amountMin: number
    amountMax: number
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentPlanUncheckedCreateWithoutQuoteInput = {
    id?: string
    stageKind: $Enums.PaymentStageKind
    percentage: number
    dueText: string
    amountMin: number
    amountMax: number
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentPlanCreateOrConnectWithoutQuoteInput = {
    where: PaymentPlanWhereUniqueInput
    create: XOR<PaymentPlanCreateWithoutQuoteInput, PaymentPlanUncheckedCreateWithoutQuoteInput>
  }

  export type PaymentPlanCreateManyQuoteInputEnvelope = {
    data: PaymentPlanCreateManyQuoteInput | PaymentPlanCreateManyQuoteInput[]
  }

  export type ContractDraftCreateWithoutQuoteInput = {
    id?: string
    status?: $Enums.ContractDraftStatus
    title: string
    bodyText: string
    scopeText?: string | null
    paymentSummary?: string | null
    successFeeRestricted?: boolean
    specialTerms?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    inquiry: InquiryCreateNestedOneWithoutContractDraftsInput
  }

  export type ContractDraftUncheckedCreateWithoutQuoteInput = {
    id?: string
    inquiryId: string
    status?: $Enums.ContractDraftStatus
    title: string
    bodyText: string
    scopeText?: string | null
    paymentSummary?: string | null
    successFeeRestricted?: boolean
    specialTerms?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContractDraftCreateOrConnectWithoutQuoteInput = {
    where: ContractDraftWhereUniqueInput
    create: XOR<ContractDraftCreateWithoutQuoteInput, ContractDraftUncheckedCreateWithoutQuoteInput>
  }

  export type InquiryUpsertWithoutQuotesInput = {
    update: XOR<InquiryUpdateWithoutQuotesInput, InquiryUncheckedUpdateWithoutQuotesInput>
    create: XOR<InquiryCreateWithoutQuotesInput, InquiryUncheckedCreateWithoutQuotesInput>
    where?: InquiryWhereInput
  }

  export type InquiryUpdateToOneWithWhereWithoutQuotesInput = {
    where?: InquiryWhereInput
    data: XOR<InquiryUpdateWithoutQuotesInput, InquiryUncheckedUpdateWithoutQuotesInput>
  }

  export type InquiryUpdateWithoutQuotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumInquiryStatusFieldUpdateOperationsInput | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeFieldUpdateOperationsInput | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelFieldUpdateOperationsInput | $Enums.UrgencyLevel
    classificationConfidence?: FloatFieldUpdateOperationsInput | number
    qualificationScore?: IntFieldUpdateOperationsInput | number
    preferredLanguage?: EnumLanguageCodeFieldUpdateOperationsInput | $Enums.LanguageCode
    clientType?: EnumClientTypeFieldUpdateOperationsInput | $Enums.ClientType
    contactName?: StringFieldUpdateOperationsInput | string
    organizationName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    nationality?: NullableStringFieldUpdateOperationsInput | string | null
    currentStatus?: NullableStringFieldUpdateOperationsInput | string | null
    documentCountry?: NullableStringFieldUpdateOperationsInput | string | null
    targetAgency?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignee?: NullableStringFieldUpdateOperationsInput | string | null
    internalMemo?: NullableStringFieldUpdateOperationsInput | string | null
    wantsCallback?: BoolFieldUpdateOperationsInput | boolean
    consentToPrivacy?: BoolFieldUpdateOperationsInput | boolean
    intakeSource?: StringFieldUpdateOperationsInput | string
    generatedSummary?: StringFieldUpdateOperationsInput | string
    generatedGuidance?: StringFieldUpdateOperationsInput | string
    generatedReceiptMessage?: StringFieldUpdateOperationsInput | string
    classificationReason?: StringFieldUpdateOperationsInput | string
    recommendedNextStep?: StringFieldUpdateOperationsInput | string
    serviceTags?: StringFieldUpdateOperationsInput | string
    contractDrafts?: ContractDraftUpdateManyWithoutInquiryNestedInput
  }

  export type InquiryUncheckedUpdateWithoutQuotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumInquiryStatusFieldUpdateOperationsInput | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeFieldUpdateOperationsInput | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelFieldUpdateOperationsInput | $Enums.UrgencyLevel
    classificationConfidence?: FloatFieldUpdateOperationsInput | number
    qualificationScore?: IntFieldUpdateOperationsInput | number
    preferredLanguage?: EnumLanguageCodeFieldUpdateOperationsInput | $Enums.LanguageCode
    clientType?: EnumClientTypeFieldUpdateOperationsInput | $Enums.ClientType
    contactName?: StringFieldUpdateOperationsInput | string
    organizationName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    nationality?: NullableStringFieldUpdateOperationsInput | string | null
    currentStatus?: NullableStringFieldUpdateOperationsInput | string | null
    documentCountry?: NullableStringFieldUpdateOperationsInput | string | null
    targetAgency?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignee?: NullableStringFieldUpdateOperationsInput | string | null
    internalMemo?: NullableStringFieldUpdateOperationsInput | string | null
    wantsCallback?: BoolFieldUpdateOperationsInput | boolean
    consentToPrivacy?: BoolFieldUpdateOperationsInput | boolean
    intakeSource?: StringFieldUpdateOperationsInput | string
    generatedSummary?: StringFieldUpdateOperationsInput | string
    generatedGuidance?: StringFieldUpdateOperationsInput | string
    generatedReceiptMessage?: StringFieldUpdateOperationsInput | string
    classificationReason?: StringFieldUpdateOperationsInput | string
    recommendedNextStep?: StringFieldUpdateOperationsInput | string
    serviceTags?: StringFieldUpdateOperationsInput | string
    contractDrafts?: ContractDraftUncheckedUpdateManyWithoutInquiryNestedInput
  }

  export type QuoteLineItemUpsertWithWhereUniqueWithoutQuoteInput = {
    where: QuoteLineItemWhereUniqueInput
    update: XOR<QuoteLineItemUpdateWithoutQuoteInput, QuoteLineItemUncheckedUpdateWithoutQuoteInput>
    create: XOR<QuoteLineItemCreateWithoutQuoteInput, QuoteLineItemUncheckedCreateWithoutQuoteInput>
  }

  export type QuoteLineItemUpdateWithWhereUniqueWithoutQuoteInput = {
    where: QuoteLineItemWhereUniqueInput
    data: XOR<QuoteLineItemUpdateWithoutQuoteInput, QuoteLineItemUncheckedUpdateWithoutQuoteInput>
  }

  export type QuoteLineItemUpdateManyWithWhereWithoutQuoteInput = {
    where: QuoteLineItemScalarWhereInput
    data: XOR<QuoteLineItemUpdateManyMutationInput, QuoteLineItemUncheckedUpdateManyWithoutQuoteInput>
  }

  export type QuoteAdjustmentUpsertWithWhereUniqueWithoutQuoteInput = {
    where: QuoteAdjustmentWhereUniqueInput
    update: XOR<QuoteAdjustmentUpdateWithoutQuoteInput, QuoteAdjustmentUncheckedUpdateWithoutQuoteInput>
    create: XOR<QuoteAdjustmentCreateWithoutQuoteInput, QuoteAdjustmentUncheckedCreateWithoutQuoteInput>
  }

  export type QuoteAdjustmentUpdateWithWhereUniqueWithoutQuoteInput = {
    where: QuoteAdjustmentWhereUniqueInput
    data: XOR<QuoteAdjustmentUpdateWithoutQuoteInput, QuoteAdjustmentUncheckedUpdateWithoutQuoteInput>
  }

  export type QuoteAdjustmentUpdateManyWithWhereWithoutQuoteInput = {
    where: QuoteAdjustmentScalarWhereInput
    data: XOR<QuoteAdjustmentUpdateManyMutationInput, QuoteAdjustmentUncheckedUpdateManyWithoutQuoteInput>
  }

  export type PaymentPlanUpsertWithWhereUniqueWithoutQuoteInput = {
    where: PaymentPlanWhereUniqueInput
    update: XOR<PaymentPlanUpdateWithoutQuoteInput, PaymentPlanUncheckedUpdateWithoutQuoteInput>
    create: XOR<PaymentPlanCreateWithoutQuoteInput, PaymentPlanUncheckedCreateWithoutQuoteInput>
  }

  export type PaymentPlanUpdateWithWhereUniqueWithoutQuoteInput = {
    where: PaymentPlanWhereUniqueInput
    data: XOR<PaymentPlanUpdateWithoutQuoteInput, PaymentPlanUncheckedUpdateWithoutQuoteInput>
  }

  export type PaymentPlanUpdateManyWithWhereWithoutQuoteInput = {
    where: PaymentPlanScalarWhereInput
    data: XOR<PaymentPlanUpdateManyMutationInput, PaymentPlanUncheckedUpdateManyWithoutQuoteInput>
  }

  export type PaymentPlanScalarWhereInput = {
    AND?: PaymentPlanScalarWhereInput | PaymentPlanScalarWhereInput[]
    OR?: PaymentPlanScalarWhereInput[]
    NOT?: PaymentPlanScalarWhereInput | PaymentPlanScalarWhereInput[]
    id?: StringFilter<"PaymentPlan"> | string
    quoteId?: StringFilter<"PaymentPlan"> | string
    stageKind?: EnumPaymentStageKindFilter<"PaymentPlan"> | $Enums.PaymentStageKind
    percentage?: IntFilter<"PaymentPlan"> | number
    dueText?: StringFilter<"PaymentPlan"> | string
    amountMin?: IntFilter<"PaymentPlan"> | number
    amountMax?: IntFilter<"PaymentPlan"> | number
    sortOrder?: IntFilter<"PaymentPlan"> | number
    createdAt?: DateTimeFilter<"PaymentPlan"> | Date | string
    updatedAt?: DateTimeFilter<"PaymentPlan"> | Date | string
  }

  export type ContractDraftUpsertWithoutQuoteInput = {
    update: XOR<ContractDraftUpdateWithoutQuoteInput, ContractDraftUncheckedUpdateWithoutQuoteInput>
    create: XOR<ContractDraftCreateWithoutQuoteInput, ContractDraftUncheckedCreateWithoutQuoteInput>
    where?: ContractDraftWhereInput
  }

  export type ContractDraftUpdateToOneWithWhereWithoutQuoteInput = {
    where?: ContractDraftWhereInput
    data: XOR<ContractDraftUpdateWithoutQuoteInput, ContractDraftUncheckedUpdateWithoutQuoteInput>
  }

  export type ContractDraftUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumContractDraftStatusFieldUpdateOperationsInput | $Enums.ContractDraftStatus
    title?: StringFieldUpdateOperationsInput | string
    bodyText?: StringFieldUpdateOperationsInput | string
    scopeText?: NullableStringFieldUpdateOperationsInput | string | null
    paymentSummary?: NullableStringFieldUpdateOperationsInput | string | null
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    specialTerms?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inquiry?: InquiryUpdateOneRequiredWithoutContractDraftsNestedInput
  }

  export type ContractDraftUncheckedUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    inquiryId?: StringFieldUpdateOperationsInput | string
    status?: EnumContractDraftStatusFieldUpdateOperationsInput | $Enums.ContractDraftStatus
    title?: StringFieldUpdateOperationsInput | string
    bodyText?: StringFieldUpdateOperationsInput | string
    scopeText?: NullableStringFieldUpdateOperationsInput | string | null
    paymentSummary?: NullableStringFieldUpdateOperationsInput | string | null
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    specialTerms?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteCreateWithoutLineItemsInput = {
    id?: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    inquiry: InquiryCreateNestedOneWithoutQuotesInput
    adjustments?: QuoteAdjustmentCreateNestedManyWithoutQuoteInput
    paymentPlans?: PaymentPlanCreateNestedManyWithoutQuoteInput
    contractDraft?: ContractDraftCreateNestedOneWithoutQuoteInput
  }

  export type QuoteUncheckedCreateWithoutLineItemsInput = {
    id?: string
    inquiryId: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    adjustments?: QuoteAdjustmentUncheckedCreateNestedManyWithoutQuoteInput
    paymentPlans?: PaymentPlanUncheckedCreateNestedManyWithoutQuoteInput
    contractDraft?: ContractDraftUncheckedCreateNestedOneWithoutQuoteInput
  }

  export type QuoteCreateOrConnectWithoutLineItemsInput = {
    where: QuoteWhereUniqueInput
    create: XOR<QuoteCreateWithoutLineItemsInput, QuoteUncheckedCreateWithoutLineItemsInput>
  }

  export type ServiceTypeCreateWithoutQuoteLineItemsInput = {
    id?: string
    legacyId: string
    name: string
    category: string
    minPrice: number
    maxPrice: number
    isAppeal?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ServiceTypeUncheckedCreateWithoutQuoteLineItemsInput = {
    id?: string
    legacyId: string
    name: string
    category: string
    minPrice: number
    maxPrice: number
    isAppeal?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ServiceTypeCreateOrConnectWithoutQuoteLineItemsInput = {
    where: ServiceTypeWhereUniqueInput
    create: XOR<ServiceTypeCreateWithoutQuoteLineItemsInput, ServiceTypeUncheckedCreateWithoutQuoteLineItemsInput>
  }

  export type QuoteUpsertWithoutLineItemsInput = {
    update: XOR<QuoteUpdateWithoutLineItemsInput, QuoteUncheckedUpdateWithoutLineItemsInput>
    create: XOR<QuoteCreateWithoutLineItemsInput, QuoteUncheckedCreateWithoutLineItemsInput>
    where?: QuoteWhereInput
  }

  export type QuoteUpdateToOneWithWhereWithoutLineItemsInput = {
    where?: QuoteWhereInput
    data: XOR<QuoteUpdateWithoutLineItemsInput, QuoteUncheckedUpdateWithoutLineItemsInput>
  }

  export type QuoteUpdateWithoutLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inquiry?: InquiryUpdateOneRequiredWithoutQuotesNestedInput
    adjustments?: QuoteAdjustmentUpdateManyWithoutQuoteNestedInput
    paymentPlans?: PaymentPlanUpdateManyWithoutQuoteNestedInput
    contractDraft?: ContractDraftUpdateOneWithoutQuoteNestedInput
  }

  export type QuoteUncheckedUpdateWithoutLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    inquiryId?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    adjustments?: QuoteAdjustmentUncheckedUpdateManyWithoutQuoteNestedInput
    paymentPlans?: PaymentPlanUncheckedUpdateManyWithoutQuoteNestedInput
    contractDraft?: ContractDraftUncheckedUpdateOneWithoutQuoteNestedInput
  }

  export type ServiceTypeUpsertWithoutQuoteLineItemsInput = {
    update: XOR<ServiceTypeUpdateWithoutQuoteLineItemsInput, ServiceTypeUncheckedUpdateWithoutQuoteLineItemsInput>
    create: XOR<ServiceTypeCreateWithoutQuoteLineItemsInput, ServiceTypeUncheckedCreateWithoutQuoteLineItemsInput>
    where?: ServiceTypeWhereInput
  }

  export type ServiceTypeUpdateToOneWithWhereWithoutQuoteLineItemsInput = {
    where?: ServiceTypeWhereInput
    data: XOR<ServiceTypeUpdateWithoutQuoteLineItemsInput, ServiceTypeUncheckedUpdateWithoutQuoteLineItemsInput>
  }

  export type ServiceTypeUpdateWithoutQuoteLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    minPrice?: IntFieldUpdateOperationsInput | number
    maxPrice?: IntFieldUpdateOperationsInput | number
    isAppeal?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ServiceTypeUncheckedUpdateWithoutQuoteLineItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    minPrice?: IntFieldUpdateOperationsInput | number
    maxPrice?: IntFieldUpdateOperationsInput | number
    isAppeal?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteCreateWithoutAdjustmentsInput = {
    id?: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    inquiry: InquiryCreateNestedOneWithoutQuotesInput
    lineItems?: QuoteLineItemCreateNestedManyWithoutQuoteInput
    paymentPlans?: PaymentPlanCreateNestedManyWithoutQuoteInput
    contractDraft?: ContractDraftCreateNestedOneWithoutQuoteInput
  }

  export type QuoteUncheckedCreateWithoutAdjustmentsInput = {
    id?: string
    inquiryId: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: QuoteLineItemUncheckedCreateNestedManyWithoutQuoteInput
    paymentPlans?: PaymentPlanUncheckedCreateNestedManyWithoutQuoteInput
    contractDraft?: ContractDraftUncheckedCreateNestedOneWithoutQuoteInput
  }

  export type QuoteCreateOrConnectWithoutAdjustmentsInput = {
    where: QuoteWhereUniqueInput
    create: XOR<QuoteCreateWithoutAdjustmentsInput, QuoteUncheckedCreateWithoutAdjustmentsInput>
  }

  export type PricingOptionCreateWithoutQuoteAdjustmentsInput = {
    id?: string
    legacyId: string
    name: string
    description: string
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    unitLabel?: string | null
    isVat?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PricingOptionUncheckedCreateWithoutQuoteAdjustmentsInput = {
    id?: string
    legacyId: string
    name: string
    description: string
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    unitLabel?: string | null
    isVat?: boolean
    isActive?: boolean
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PricingOptionCreateOrConnectWithoutQuoteAdjustmentsInput = {
    where: PricingOptionWhereUniqueInput
    create: XOR<PricingOptionCreateWithoutQuoteAdjustmentsInput, PricingOptionUncheckedCreateWithoutQuoteAdjustmentsInput>
  }

  export type QuoteUpsertWithoutAdjustmentsInput = {
    update: XOR<QuoteUpdateWithoutAdjustmentsInput, QuoteUncheckedUpdateWithoutAdjustmentsInput>
    create: XOR<QuoteCreateWithoutAdjustmentsInput, QuoteUncheckedCreateWithoutAdjustmentsInput>
    where?: QuoteWhereInput
  }

  export type QuoteUpdateToOneWithWhereWithoutAdjustmentsInput = {
    where?: QuoteWhereInput
    data: XOR<QuoteUpdateWithoutAdjustmentsInput, QuoteUncheckedUpdateWithoutAdjustmentsInput>
  }

  export type QuoteUpdateWithoutAdjustmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inquiry?: InquiryUpdateOneRequiredWithoutQuotesNestedInput
    lineItems?: QuoteLineItemUpdateManyWithoutQuoteNestedInput
    paymentPlans?: PaymentPlanUpdateManyWithoutQuoteNestedInput
    contractDraft?: ContractDraftUpdateOneWithoutQuoteNestedInput
  }

  export type QuoteUncheckedUpdateWithoutAdjustmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    inquiryId?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: QuoteLineItemUncheckedUpdateManyWithoutQuoteNestedInput
    paymentPlans?: PaymentPlanUncheckedUpdateManyWithoutQuoteNestedInput
    contractDraft?: ContractDraftUncheckedUpdateOneWithoutQuoteNestedInput
  }

  export type PricingOptionUpsertWithoutQuoteAdjustmentsInput = {
    update: XOR<PricingOptionUpdateWithoutQuoteAdjustmentsInput, PricingOptionUncheckedUpdateWithoutQuoteAdjustmentsInput>
    create: XOR<PricingOptionCreateWithoutQuoteAdjustmentsInput, PricingOptionUncheckedCreateWithoutQuoteAdjustmentsInput>
    where?: PricingOptionWhereInput
  }

  export type PricingOptionUpdateToOneWithWhereWithoutQuoteAdjustmentsInput = {
    where?: PricingOptionWhereInput
    data: XOR<PricingOptionUpdateWithoutQuoteAdjustmentsInput, PricingOptionUncheckedUpdateWithoutQuoteAdjustmentsInput>
  }

  export type PricingOptionUpdateWithoutQuoteAdjustmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    unitLabel?: NullableStringFieldUpdateOperationsInput | string | null
    isVat?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PricingOptionUncheckedUpdateWithoutQuoteAdjustmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    legacyId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    unitLabel?: NullableStringFieldUpdateOperationsInput | string | null
    isVat?: BoolFieldUpdateOperationsInput | boolean
    isActive?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteCreateWithoutPaymentPlansInput = {
    id?: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    inquiry: InquiryCreateNestedOneWithoutQuotesInput
    lineItems?: QuoteLineItemCreateNestedManyWithoutQuoteInput
    adjustments?: QuoteAdjustmentCreateNestedManyWithoutQuoteInput
    contractDraft?: ContractDraftCreateNestedOneWithoutQuoteInput
  }

  export type QuoteUncheckedCreateWithoutPaymentPlansInput = {
    id?: string
    inquiryId: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: QuoteLineItemUncheckedCreateNestedManyWithoutQuoteInput
    adjustments?: QuoteAdjustmentUncheckedCreateNestedManyWithoutQuoteInput
    contractDraft?: ContractDraftUncheckedCreateNestedOneWithoutQuoteInput
  }

  export type QuoteCreateOrConnectWithoutPaymentPlansInput = {
    where: QuoteWhereUniqueInput
    create: XOR<QuoteCreateWithoutPaymentPlansInput, QuoteUncheckedCreateWithoutPaymentPlansInput>
  }

  export type QuoteUpsertWithoutPaymentPlansInput = {
    update: XOR<QuoteUpdateWithoutPaymentPlansInput, QuoteUncheckedUpdateWithoutPaymentPlansInput>
    create: XOR<QuoteCreateWithoutPaymentPlansInput, QuoteUncheckedCreateWithoutPaymentPlansInput>
    where?: QuoteWhereInput
  }

  export type QuoteUpdateToOneWithWhereWithoutPaymentPlansInput = {
    where?: QuoteWhereInput
    data: XOR<QuoteUpdateWithoutPaymentPlansInput, QuoteUncheckedUpdateWithoutPaymentPlansInput>
  }

  export type QuoteUpdateWithoutPaymentPlansInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inquiry?: InquiryUpdateOneRequiredWithoutQuotesNestedInput
    lineItems?: QuoteLineItemUpdateManyWithoutQuoteNestedInput
    adjustments?: QuoteAdjustmentUpdateManyWithoutQuoteNestedInput
    contractDraft?: ContractDraftUpdateOneWithoutQuoteNestedInput
  }

  export type QuoteUncheckedUpdateWithoutPaymentPlansInput = {
    id?: StringFieldUpdateOperationsInput | string
    inquiryId?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: QuoteLineItemUncheckedUpdateManyWithoutQuoteNestedInput
    adjustments?: QuoteAdjustmentUncheckedUpdateManyWithoutQuoteNestedInput
    contractDraft?: ContractDraftUncheckedUpdateOneWithoutQuoteNestedInput
  }

  export type InquiryCreateWithoutContractDraftsInput = {
    id?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    status?: $Enums.InquiryStatus
    inquiryType?: $Enums.InquiryType
    urgencyLevel?: $Enums.UrgencyLevel
    classificationConfidence?: number
    qualificationScore?: number
    preferredLanguage?: $Enums.LanguageCode
    clientType?: $Enums.ClientType
    contactName: string
    organizationName?: string | null
    email: string
    phone?: string | null
    title: string
    description: string
    nationality?: string | null
    currentStatus?: string | null
    documentCountry?: string | null
    targetAgency?: string | null
    dueDate?: Date | string | null
    assignee?: string | null
    internalMemo?: string | null
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: string
    generatedSummary: string
    generatedGuidance: string
    generatedReceiptMessage: string
    classificationReason: string
    recommendedNextStep: string
    serviceTags?: string
    quotes?: QuoteCreateNestedManyWithoutInquiryInput
  }

  export type InquiryUncheckedCreateWithoutContractDraftsInput = {
    id?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    status?: $Enums.InquiryStatus
    inquiryType?: $Enums.InquiryType
    urgencyLevel?: $Enums.UrgencyLevel
    classificationConfidence?: number
    qualificationScore?: number
    preferredLanguage?: $Enums.LanguageCode
    clientType?: $Enums.ClientType
    contactName: string
    organizationName?: string | null
    email: string
    phone?: string | null
    title: string
    description: string
    nationality?: string | null
    currentStatus?: string | null
    documentCountry?: string | null
    targetAgency?: string | null
    dueDate?: Date | string | null
    assignee?: string | null
    internalMemo?: string | null
    wantsCallback?: boolean
    consentToPrivacy?: boolean
    intakeSource?: string
    generatedSummary: string
    generatedGuidance: string
    generatedReceiptMessage: string
    classificationReason: string
    recommendedNextStep: string
    serviceTags?: string
    quotes?: QuoteUncheckedCreateNestedManyWithoutInquiryInput
  }

  export type InquiryCreateOrConnectWithoutContractDraftsInput = {
    where: InquiryWhereUniqueInput
    create: XOR<InquiryCreateWithoutContractDraftsInput, InquiryUncheckedCreateWithoutContractDraftsInput>
  }

  export type QuoteCreateWithoutContractDraftInput = {
    id?: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    inquiry: InquiryCreateNestedOneWithoutQuotesInput
    lineItems?: QuoteLineItemCreateNestedManyWithoutQuoteInput
    adjustments?: QuoteAdjustmentCreateNestedManyWithoutQuoteInput
    paymentPlans?: PaymentPlanCreateNestedManyWithoutQuoteInput
  }

  export type QuoteUncheckedCreateWithoutContractDraftInput = {
    id?: string
    inquiryId: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lineItems?: QuoteLineItemUncheckedCreateNestedManyWithoutQuoteInput
    adjustments?: QuoteAdjustmentUncheckedCreateNestedManyWithoutQuoteInput
    paymentPlans?: PaymentPlanUncheckedCreateNestedManyWithoutQuoteInput
  }

  export type QuoteCreateOrConnectWithoutContractDraftInput = {
    where: QuoteWhereUniqueInput
    create: XOR<QuoteCreateWithoutContractDraftInput, QuoteUncheckedCreateWithoutContractDraftInput>
  }

  export type InquiryUpsertWithoutContractDraftsInput = {
    update: XOR<InquiryUpdateWithoutContractDraftsInput, InquiryUncheckedUpdateWithoutContractDraftsInput>
    create: XOR<InquiryCreateWithoutContractDraftsInput, InquiryUncheckedCreateWithoutContractDraftsInput>
    where?: InquiryWhereInput
  }

  export type InquiryUpdateToOneWithWhereWithoutContractDraftsInput = {
    where?: InquiryWhereInput
    data: XOR<InquiryUpdateWithoutContractDraftsInput, InquiryUncheckedUpdateWithoutContractDraftsInput>
  }

  export type InquiryUpdateWithoutContractDraftsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumInquiryStatusFieldUpdateOperationsInput | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeFieldUpdateOperationsInput | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelFieldUpdateOperationsInput | $Enums.UrgencyLevel
    classificationConfidence?: FloatFieldUpdateOperationsInput | number
    qualificationScore?: IntFieldUpdateOperationsInput | number
    preferredLanguage?: EnumLanguageCodeFieldUpdateOperationsInput | $Enums.LanguageCode
    clientType?: EnumClientTypeFieldUpdateOperationsInput | $Enums.ClientType
    contactName?: StringFieldUpdateOperationsInput | string
    organizationName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    nationality?: NullableStringFieldUpdateOperationsInput | string | null
    currentStatus?: NullableStringFieldUpdateOperationsInput | string | null
    documentCountry?: NullableStringFieldUpdateOperationsInput | string | null
    targetAgency?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignee?: NullableStringFieldUpdateOperationsInput | string | null
    internalMemo?: NullableStringFieldUpdateOperationsInput | string | null
    wantsCallback?: BoolFieldUpdateOperationsInput | boolean
    consentToPrivacy?: BoolFieldUpdateOperationsInput | boolean
    intakeSource?: StringFieldUpdateOperationsInput | string
    generatedSummary?: StringFieldUpdateOperationsInput | string
    generatedGuidance?: StringFieldUpdateOperationsInput | string
    generatedReceiptMessage?: StringFieldUpdateOperationsInput | string
    classificationReason?: StringFieldUpdateOperationsInput | string
    recommendedNextStep?: StringFieldUpdateOperationsInput | string
    serviceTags?: StringFieldUpdateOperationsInput | string
    quotes?: QuoteUpdateManyWithoutInquiryNestedInput
  }

  export type InquiryUncheckedUpdateWithoutContractDraftsInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: EnumInquiryStatusFieldUpdateOperationsInput | $Enums.InquiryStatus
    inquiryType?: EnumInquiryTypeFieldUpdateOperationsInput | $Enums.InquiryType
    urgencyLevel?: EnumUrgencyLevelFieldUpdateOperationsInput | $Enums.UrgencyLevel
    classificationConfidence?: FloatFieldUpdateOperationsInput | number
    qualificationScore?: IntFieldUpdateOperationsInput | number
    preferredLanguage?: EnumLanguageCodeFieldUpdateOperationsInput | $Enums.LanguageCode
    clientType?: EnumClientTypeFieldUpdateOperationsInput | $Enums.ClientType
    contactName?: StringFieldUpdateOperationsInput | string
    organizationName?: NullableStringFieldUpdateOperationsInput | string | null
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    title?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    nationality?: NullableStringFieldUpdateOperationsInput | string | null
    currentStatus?: NullableStringFieldUpdateOperationsInput | string | null
    documentCountry?: NullableStringFieldUpdateOperationsInput | string | null
    targetAgency?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    assignee?: NullableStringFieldUpdateOperationsInput | string | null
    internalMemo?: NullableStringFieldUpdateOperationsInput | string | null
    wantsCallback?: BoolFieldUpdateOperationsInput | boolean
    consentToPrivacy?: BoolFieldUpdateOperationsInput | boolean
    intakeSource?: StringFieldUpdateOperationsInput | string
    generatedSummary?: StringFieldUpdateOperationsInput | string
    generatedGuidance?: StringFieldUpdateOperationsInput | string
    generatedReceiptMessage?: StringFieldUpdateOperationsInput | string
    classificationReason?: StringFieldUpdateOperationsInput | string
    recommendedNextStep?: StringFieldUpdateOperationsInput | string
    serviceTags?: StringFieldUpdateOperationsInput | string
    quotes?: QuoteUncheckedUpdateManyWithoutInquiryNestedInput
  }

  export type QuoteUpsertWithoutContractDraftInput = {
    update: XOR<QuoteUpdateWithoutContractDraftInput, QuoteUncheckedUpdateWithoutContractDraftInput>
    create: XOR<QuoteCreateWithoutContractDraftInput, QuoteUncheckedCreateWithoutContractDraftInput>
    where?: QuoteWhereInput
  }

  export type QuoteUpdateToOneWithWhereWithoutContractDraftInput = {
    where?: QuoteWhereInput
    data: XOR<QuoteUpdateWithoutContractDraftInput, QuoteUncheckedUpdateWithoutContractDraftInput>
  }

  export type QuoteUpdateWithoutContractDraftInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inquiry?: InquiryUpdateOneRequiredWithoutQuotesNestedInput
    lineItems?: QuoteLineItemUpdateManyWithoutQuoteNestedInput
    adjustments?: QuoteAdjustmentUpdateManyWithoutQuoteNestedInput
    paymentPlans?: PaymentPlanUpdateManyWithoutQuoteNestedInput
  }

  export type QuoteUncheckedUpdateWithoutContractDraftInput = {
    id?: StringFieldUpdateOperationsInput | string
    inquiryId?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: QuoteLineItemUncheckedUpdateManyWithoutQuoteNestedInput
    adjustments?: QuoteAdjustmentUncheckedUpdateManyWithoutQuoteNestedInput
    paymentPlans?: PaymentPlanUncheckedUpdateManyWithoutQuoteNestedInput
  }

  export type QuoteCreateManyInquiryInput = {
    id?: string
    status?: $Enums.QuoteStatus
    selectedServiceLegacyIds?: string
    selectedOptionLegacyIds?: string
    urgencyRuleCode: string
    consultRuleCode: string
    paymentRuleCode?: string
    rangeMode?: boolean
    serviceBaseMin?: number
    serviceBaseMax?: number
    subtotalMin?: number
    subtotalMax?: number
    vatAmountMin?: number
    vatAmountMax?: number
    totalMin?: number
    totalMax?: number
    consultFee?: number
    successFeeRestricted?: boolean
    draftNotes?: string | null
    calculationSummary?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ContractDraftCreateManyInquiryInput = {
    id?: string
    quoteId: string
    status?: $Enums.ContractDraftStatus
    title: string
    bodyText: string
    scopeText?: string | null
    paymentSummary?: string | null
    successFeeRestricted?: boolean
    specialTerms?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteUpdateWithoutInquiryInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: QuoteLineItemUpdateManyWithoutQuoteNestedInput
    adjustments?: QuoteAdjustmentUpdateManyWithoutQuoteNestedInput
    paymentPlans?: PaymentPlanUpdateManyWithoutQuoteNestedInput
    contractDraft?: ContractDraftUpdateOneWithoutQuoteNestedInput
  }

  export type QuoteUncheckedUpdateWithoutInquiryInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lineItems?: QuoteLineItemUncheckedUpdateManyWithoutQuoteNestedInput
    adjustments?: QuoteAdjustmentUncheckedUpdateManyWithoutQuoteNestedInput
    paymentPlans?: PaymentPlanUncheckedUpdateManyWithoutQuoteNestedInput
    contractDraft?: ContractDraftUncheckedUpdateOneWithoutQuoteNestedInput
  }

  export type QuoteUncheckedUpdateManyWithoutInquiryInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumQuoteStatusFieldUpdateOperationsInput | $Enums.QuoteStatus
    selectedServiceLegacyIds?: StringFieldUpdateOperationsInput | string
    selectedOptionLegacyIds?: StringFieldUpdateOperationsInput | string
    urgencyRuleCode?: StringFieldUpdateOperationsInput | string
    consultRuleCode?: StringFieldUpdateOperationsInput | string
    paymentRuleCode?: StringFieldUpdateOperationsInput | string
    rangeMode?: BoolFieldUpdateOperationsInput | boolean
    serviceBaseMin?: IntFieldUpdateOperationsInput | number
    serviceBaseMax?: IntFieldUpdateOperationsInput | number
    subtotalMin?: IntFieldUpdateOperationsInput | number
    subtotalMax?: IntFieldUpdateOperationsInput | number
    vatAmountMin?: IntFieldUpdateOperationsInput | number
    vatAmountMax?: IntFieldUpdateOperationsInput | number
    totalMin?: IntFieldUpdateOperationsInput | number
    totalMax?: IntFieldUpdateOperationsInput | number
    consultFee?: IntFieldUpdateOperationsInput | number
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    draftNotes?: NullableStringFieldUpdateOperationsInput | string | null
    calculationSummary?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContractDraftUpdateWithoutInquiryInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumContractDraftStatusFieldUpdateOperationsInput | $Enums.ContractDraftStatus
    title?: StringFieldUpdateOperationsInput | string
    bodyText?: StringFieldUpdateOperationsInput | string
    scopeText?: NullableStringFieldUpdateOperationsInput | string | null
    paymentSummary?: NullableStringFieldUpdateOperationsInput | string | null
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    specialTerms?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: QuoteUpdateOneRequiredWithoutContractDraftNestedInput
  }

  export type ContractDraftUncheckedUpdateWithoutInquiryInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    status?: EnumContractDraftStatusFieldUpdateOperationsInput | $Enums.ContractDraftStatus
    title?: StringFieldUpdateOperationsInput | string
    bodyText?: StringFieldUpdateOperationsInput | string
    scopeText?: NullableStringFieldUpdateOperationsInput | string | null
    paymentSummary?: NullableStringFieldUpdateOperationsInput | string | null
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    specialTerms?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ContractDraftUncheckedUpdateManyWithoutInquiryInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    status?: EnumContractDraftStatusFieldUpdateOperationsInput | $Enums.ContractDraftStatus
    title?: StringFieldUpdateOperationsInput | string
    bodyText?: StringFieldUpdateOperationsInput | string
    scopeText?: NullableStringFieldUpdateOperationsInput | string | null
    paymentSummary?: NullableStringFieldUpdateOperationsInput | string | null
    successFeeRestricted?: BoolFieldUpdateOperationsInput | boolean
    specialTerms?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteLineItemCreateManyServiceTypeInput = {
    id?: string
    quoteId: string
    kind: $Enums.QuoteLineKind
    label: string
    description?: string | null
    amountMin: number
    amountMax: number
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteLineItemUpdateWithoutServiceTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: EnumQuoteLineKindFieldUpdateOperationsInput | $Enums.QuoteLineKind
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: QuoteUpdateOneRequiredWithoutLineItemsNestedInput
  }

  export type QuoteLineItemUncheckedUpdateWithoutServiceTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    kind?: EnumQuoteLineKindFieldUpdateOperationsInput | $Enums.QuoteLineKind
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteLineItemUncheckedUpdateManyWithoutServiceTypeInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    kind?: EnumQuoteLineKindFieldUpdateOperationsInput | $Enums.QuoteLineKind
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteAdjustmentCreateManyPricingOptionInput = {
    id?: string
    quoteId: string
    label: string
    description?: string | null
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    computedMin: number
    computedMax: number
    isVat?: boolean
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteAdjustmentUpdateWithoutPricingOptionInput = {
    id?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    computedMin?: IntFieldUpdateOperationsInput | number
    computedMax?: IntFieldUpdateOperationsInput | number
    isVat?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    quote?: QuoteUpdateOneRequiredWithoutAdjustmentsNestedInput
  }

  export type QuoteAdjustmentUncheckedUpdateWithoutPricingOptionInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    computedMin?: IntFieldUpdateOperationsInput | number
    computedMax?: IntFieldUpdateOperationsInput | number
    isVat?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteAdjustmentUncheckedUpdateManyWithoutPricingOptionInput = {
    id?: StringFieldUpdateOperationsInput | string
    quoteId?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    computedMin?: IntFieldUpdateOperationsInput | number
    computedMax?: IntFieldUpdateOperationsInput | number
    isVat?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteLineItemCreateManyQuoteInput = {
    id?: string
    serviceTypeId?: string | null
    kind: $Enums.QuoteLineKind
    label: string
    description?: string | null
    amountMin: number
    amountMax: number
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteAdjustmentCreateManyQuoteInput = {
    id?: string
    pricingOptionId?: string | null
    label: string
    description?: string | null
    optionType: $Enums.PricingOptionType
    flatAmount?: number | null
    percentRate?: number | null
    computedMin: number
    computedMax: number
    isVat?: boolean
    sortOrder?: number
    isManual?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentPlanCreateManyQuoteInput = {
    id?: string
    stageKind: $Enums.PaymentStageKind
    percentage: number
    dueText: string
    amountMin: number
    amountMax: number
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type QuoteLineItemUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: EnumQuoteLineKindFieldUpdateOperationsInput | $Enums.QuoteLineKind
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    serviceType?: ServiceTypeUpdateOneWithoutQuoteLineItemsNestedInput
  }

  export type QuoteLineItemUncheckedUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    serviceTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumQuoteLineKindFieldUpdateOperationsInput | $Enums.QuoteLineKind
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteLineItemUncheckedUpdateManyWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    serviceTypeId?: NullableStringFieldUpdateOperationsInput | string | null
    kind?: EnumQuoteLineKindFieldUpdateOperationsInput | $Enums.QuoteLineKind
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteAdjustmentUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    computedMin?: IntFieldUpdateOperationsInput | number
    computedMax?: IntFieldUpdateOperationsInput | number
    isVat?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    pricingOption?: PricingOptionUpdateOneWithoutQuoteAdjustmentsNestedInput
  }

  export type QuoteAdjustmentUncheckedUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    pricingOptionId?: NullableStringFieldUpdateOperationsInput | string | null
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    computedMin?: IntFieldUpdateOperationsInput | number
    computedMax?: IntFieldUpdateOperationsInput | number
    isVat?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type QuoteAdjustmentUncheckedUpdateManyWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    pricingOptionId?: NullableStringFieldUpdateOperationsInput | string | null
    label?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    optionType?: EnumPricingOptionTypeFieldUpdateOperationsInput | $Enums.PricingOptionType
    flatAmount?: NullableIntFieldUpdateOperationsInput | number | null
    percentRate?: NullableIntFieldUpdateOperationsInput | number | null
    computedMin?: IntFieldUpdateOperationsInput | number
    computedMax?: IntFieldUpdateOperationsInput | number
    isVat?: BoolFieldUpdateOperationsInput | boolean
    sortOrder?: IntFieldUpdateOperationsInput | number
    isManual?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentPlanUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    stageKind?: EnumPaymentStageKindFieldUpdateOperationsInput | $Enums.PaymentStageKind
    percentage?: IntFieldUpdateOperationsInput | number
    dueText?: StringFieldUpdateOperationsInput | string
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentPlanUncheckedUpdateWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    stageKind?: EnumPaymentStageKindFieldUpdateOperationsInput | $Enums.PaymentStageKind
    percentage?: IntFieldUpdateOperationsInput | number
    dueText?: StringFieldUpdateOperationsInput | string
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentPlanUncheckedUpdateManyWithoutQuoteInput = {
    id?: StringFieldUpdateOperationsInput | string
    stageKind?: EnumPaymentStageKindFieldUpdateOperationsInput | $Enums.PaymentStageKind
    percentage?: IntFieldUpdateOperationsInput | number
    dueText?: StringFieldUpdateOperationsInput | string
    amountMin?: IntFieldUpdateOperationsInput | number
    amountMax?: IntFieldUpdateOperationsInput | number
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}