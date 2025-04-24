interface CreateOAuthUrlArgs {
    app: string;
}
interface CreateLlmOAuthUrlArgs {
    app: string;
    email: string;
    sk: string;
}
declare function createOAuthUrl({ app }: CreateOAuthUrlArgs): Promise<string>;
declare function createLlmOAuthUrl({ app, email, sk, }: CreateLlmOAuthUrlArgs): Promise<string>;
declare function _dont_use_in_prod_createOAuthUrl({ app, }: CreateOAuthUrlArgs): Promise<string>;
declare function _dont_use_in_prod_createLlmOAuthUrl({ app, email, sk, }: CreateLlmOAuthUrlArgs): Promise<string>;

interface DecryptSecretArgs {
    app: string;
    s: string;
}
declare function decryptSecret({ app, s }: DecryptSecretArgs): Promise<string>;
declare function _dont_use_in_prod_decryptSecret({ app, s, }: DecryptSecretArgs): Promise<string>;

export { type CreateLlmOAuthUrlArgs, type CreateOAuthUrlArgs, type DecryptSecretArgs, _dont_use_in_prod_createLlmOAuthUrl, _dont_use_in_prod_createOAuthUrl, _dont_use_in_prod_decryptSecret, createLlmOAuthUrl, createOAuthUrl, decryptSecret };
