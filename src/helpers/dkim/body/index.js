import { SimpleHash } from './simple';
import { RelaxedHash } from './relaxed';

const dkimBody = (canonicalization, ...options) => {
    canonicalization = (canonicalization || 'simple/simple').toString().split('/').pop().toLowerCase().trim();
    switch (canonicalization) {
        case 'simple':
            return new SimpleHash(...options);
        case 'relaxed':
            return new RelaxedHash(...options);
        default:
            throw new Error('Unknown body canonicalization');
    }
};

export { dkimBody };
