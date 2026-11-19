const assert = require('node:assert/strict');
const test = require('node:test');
const {load} = require('./test-loader.cjs');
const {catalogProductName,catalogVariantName,catalogItemTitle,documentItemTitle} = load('src/lib/products/catalogNames');

test('new selections use the reviewed names without changing historical labels or codes',()=>{
 const product={name:'FLP/WP Well Glass Fitting',displayName:'FLP/WP Well Glass Light Fitting'};
 const variant={variant:'45W - Multi LED 5050',displayName:'45 W / Multi LED 5050',sku:'EXISTING-SKU'};
 const old={title:'FLP/WP Well Glass Fitting - 45W - Multi LED 5050',product,variant};
 assert.equal(catalogItemTitle(product,variant),'FLP/WP Well Glass Light Fitting - 45 W / Multi LED 5050');
 assert.equal(documentItemTitle(old),old.title);
 assert.equal(product.name,'FLP/WP Well Glass Fitting');
 assert.equal(variant.variant,'45W - Multi LED 5050');
 assert.equal(variant.sku,'EXISTING-SKU');
});

test('converting an old quotation keeps its recorded title even when new catalog names exist',()=>{
 const item={title:'Customer-approved custom description',product:{name:'Old family',displayName:'New family'},variant:{variant:'Old variant',displayName:'New variant'}};
 const converted={...item};
 assert.equal(documentItemTitle(converted),'Customer-approved custom description');
 assert.equal(catalogItemTitle(item.product,item.variant),'New family - New variant');
});

test('unreviewed names and old lines without titles fall back to original labels',()=>{
 assert.equal(catalogProductName({name:'Original',displayName:' '}),'Original');
 assert.equal(catalogVariantName({variant:'Original variant',displayName:null}),'Original variant');
 assert.equal(documentItemTitle({product:{name:'Old'},variant:{variant:'45W'}}),'Old - 45W');
});

const fixture = {
 id:'variant-1',productId:'product-1',variant:'45W - Multi LED 5050',displayName:'45 W / Multi LED 5050',
 sku:'ORIGINAL-SKU',typeNumber:'ORIGINAL-TYPE',rating:'45W, 230V',images:[],drawings:[],components:[],
 product:{name:'FLP/WP Well Glass Fitting',displayName:'FLP/WP Well Glass Light Fitting',shortDesc:'Original description',hardware:'SS 304',hsnCode:'9405'},
};
const permission={requirePermission:async()=>({user:{id:'reader'}})};

test('real selection action returns new display names, unchanged specifications and legacy SKU',async()=>{
 let calls=0;
 const prisma={
  productVariant:{findMany:async({where})=>{
   calls++;
   if(calls===1){assert.equal(where.status,'ACTIVE');assert.equal(where.product.status,'ACTIVE');assert.equal(where.product.deletedAt,null);return [{id:fixture.id,updatedAt:new Date()}];}
   return [fixture];
  }},
  salesOrderItem:{groupBy:async()=>[]},
 };
 const {searchProductVariantsForSelectAction}=load('src/lib/actions/dashboard/global/product/searchProductVariantsForSelect',{'@/lib/prisma/db':{prisma},'@/lib/check/permissions':permission});
 const result=await searchProductVariantsForSelectAction({query:'well glass 45'});
 assert.equal(result.items[0].title,'FLP/WP Well Glass Light Fitting - 45 W / Multi LED 5050');
 assert.equal(result.items[0].sku,'ORIGINAL-SKU');
 assert.equal(result.items[0].rating,'45W, 230V');
 assert.equal(result.items[0].typeNumber,'ORIGINAL-TYPE');
});

test('rehydrating an existing inactive selection remains possible without rewriting its saved line',async()=>{
 const prisma={productVariant:{findUnique:async()=>({...fixture,status:'INACTIVE'})}};
 const {getProductVariantForSelectById}=load('src/lib/actions/dashboard/global/product/getProductVariantForSelectById',{'@/lib/prisma/db':{prisma},'@/lib/check/permissions':permission});
 const saved={variantId:fixture.id,title:'Previously agreed wording',qty:7,unitPrice:100};
 const before=structuredClone(saved);
 const selected=await getProductVariantForSelectById(saved.variantId);
 assert.equal(selected.variantName,'45 W / Multi LED 5050');
 assert.deepEqual(saved,before);
 assert.equal(documentItemTitle(saved),'Previously agreed wording');
});

test('approved future name edits retain original product and variant labels',async()=>{
 let variantWrite;
 const mocks={'@/lib/prisma/db':{prisma:{}},'@/lib/check/requireProductOwner':{PRODUCT_OWNER_EMAIL:'owner@example.invalid'}};
 const {productUpdateData,applyVariantUpdate}=load('src/lib/products/approval',mocks);
 const product=productUpdateData({name:'Reviewed family',slug:'existing-slug',categoryId:'existing-category',zones:[]});
 assert.equal(product.displayName,'Reviewed family');
 assert.equal(Object.hasOwn(product,'name'),false);
 await applyVariantUpdate({productVariant:{update:async(args)=>{variantWrite=args.data;}}},{id:'v',productId:'p',variant:'Reviewed variant',sku:'ORIGINAL-SKU'});
 assert.equal(variantWrite.displayName,'Reviewed variant');
 assert.equal(Object.hasOwn(variantWrite,'variant'),false);
 assert.equal(variantWrite.sku,'ORIGINAL-SKU');
});
