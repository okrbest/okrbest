// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage} from 'react-intl';

import {buttonClassNames} from '@mattermost/shared/components/button';

import useOpenSalesLink from 'components/common/hooks/useOpenSalesLink';
import EmptyBillingHistorySvg from 'components/common/svg_images_components/empty_billing_history_svg';
import UpgradeSvg from 'components/common/svg_images_components/upgrade_svg';
import ExternalLink from 'components/external_link';

import {CloudLinks, TrialPeriodDays} from 'utils/constants';

export const noBillingHistory = (
    <div className='BillingSummary__noBillingHistory'>
        <EmptyBillingHistorySvg
            height={116}
            width={152}
        />
        <div className='BillingSummary__noBillingHistory-title'>
            <FormattedMessage
                id='admin.billing.subscriptions.billing_summary.noBillingHistory.title'
                defaultMessage='No billing history yet'
            />
        </div>
        <div className='BillingSummary__noBillingHistory-message'>
            <FormattedMessage
                id='admin.billing.subscriptions.billing_summary.noBillingHistory.description'
                defaultMessage='In the future, this is where your most recent bill summary will show.'
            />
        </div>
        <ExternalLink
            location='billing_summary'
            href={CloudLinks.BILLING_DOCS}
            className={buttonClassNames({emphasis: 'primary'}, 'BillingSummary__noBillingHistory-link')}
        >
            <FormattedMessage
                id='admin.billing.subscriptions.billing_summary.noBillingHistory.link'
                defaultMessage='See how billing works'
            />
        </ExternalLink>
    </div>
);

type FreeTrialProps = {
    daysLeftOnTrial: number;
};

export const FreeTrial = ({daysLeftOnTrial}: FreeTrialProps) => {
    const [openSalesLink] = useOpenSalesLink();
    return (
        <div className='UpgradeMattermostCloud'>
            <div className='UpgradeMattermostCloud__image'>
                <UpgradeSvg
                    height={167}
                    width={234}
                />
            </div>
            <div className='UpgradeMattermostCloud__title'>
                {daysLeftOnTrial > TrialPeriodDays.TRIAL_1_DAY &&
                    <FormattedMessage
                        id='admin.billing.subscription.freeTrial.title'
                        defaultMessage={'You\'re currently on a free trial'}
                    />
                }
                {(daysLeftOnTrial === TrialPeriodDays.TRIAL_1_DAY || daysLeftOnTrial === TrialPeriodDays.TRIAL_0_DAYS) &&
                    <FormattedMessage
                        id='admin.billing.subscription.freeTrial.lastDay.title'
                        defaultMessage={'Your free trial ends today'}
                    />
                }
            </div>
            <div className='UpgradeMattermostCloud__description'>
                {daysLeftOnTrial > TrialPeriodDays.TRIAL_WARNING_THRESHOLD &&
                    <FormattedMessage
                        id='admin.billing.subscription.freeTrial.description'
                        defaultMessage='Your free trial will expire in {daysLeftOnTrial} days. Contact sales to continue after the trial ends.'
                        values={{daysLeftOnTrial}}
                    />
                }
                {(daysLeftOnTrial > TrialPeriodDays.TRIAL_1_DAY && daysLeftOnTrial <= TrialPeriodDays.TRIAL_WARNING_THRESHOLD) &&
                    <FormattedMessage
                        id='admin.billing.subscription.freeTrial.lessThan3Days.description'
                        defaultMessage='Your free trial will end in {daysLeftOnTrial, number} {daysLeftOnTrial, plural, one {day} other {days}}. Contact sales to continue enjoying the benefits of Cloud Professional.'
                        values={{daysLeftOnTrial}}
                    />
                }
                {(daysLeftOnTrial === TrialPeriodDays.TRIAL_1_DAY || daysLeftOnTrial === TrialPeriodDays.TRIAL_0_DAYS) &&
                    <FormattedMessage
                        id='admin.billing.subscription.freeTrial.lastDay.description'
                        defaultMessage='Your free trial has ended. Add payment information to continue enjoying the benefits of Cloud Professional.'
                    />
                }
            </div>
            <button
                type='button'
                onClick={() => openSalesLink()}
                className={buttonClassNames({emphasis: 'primary'}, 'UpgradeMattermostCloud__upgradeButton')}
            >
                <FormattedMessage
                    id='admin.billing.subscription.privateCloudCard.contactSales'
                    defaultMessage='Contact Sales'
                />

            </button>
        </div>);
};
