import { Middleware } from '../core/pipeline';
export declare const useRoutename: () => {
    value: string;
};
export declare const route: <T extends {
    pathname: string;
}, U>(name: string, middleware: Middleware<T, U>) => Middleware<T, U>;
