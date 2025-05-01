type ZodValidatorErrors = {
    path: string;
    message: string;
}

export interface BadRequestError {
    message: string;
    errors: ZodValidatorErrors[]
}