-- Add ASI Central as a SupplierKind and ASI Member Auth as a SupplierAuthType.
ALTER TYPE "SupplierKind" ADD VALUE 'ASI_CENTRAL';
ALTER TYPE "SupplierAuthType" ADD VALUE 'ASI_MEMBER_AUTH';
