# Product catalog

The catalog describes the electrical products and configurations used in enquiries, sales, dispatch, and manufacturing.

## Language

**Category**:
A group of related products, such as lighting fittings, switchgear, or accessories.
_Avoid_: Product, variant

**Product**:
A named product family with shared technical characteristics, containing one or more variants.
_Avoid_: Variant, SKU

**Variant**:
A particular configuration of a product, distinguished by characteristics such as power, dimensions, electrical rating, or construction.
_Avoid_: Product family

**SKU**:
The catalog identifier for a particular variant.
_Avoid_: Type number, serial number

**Type number**:
The technical model or type designation associated with a configuration; several variants can share a type number.
_Avoid_: SKU, serial number

**Product serial number**:
An identifier for one individual manufactured unit of a product.
_Avoid_: SKU, type number

**Bill of materials (BOM)**:
The quantities of raw materials and castings required to manufacture a variant.
_Avoid_: Sales component description

**Sales component description**:
A description of the components supplied with a variant or quoted item, such as an LED module and driver.
_Avoid_: BOM
