package com.odoo.hr.payroll.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
public class RabbitMqPayrollConfig {

    public static final String PAYROLL_EXCHANGE = "payroll.exchange";
    public static final String PAYSLIP_EMAIL_QUEUE = "payroll.payslip.email.queue";
    public static final String PAYSLIP_EMAIL_ROUTING_KEY = "payroll.payslip.email";

    public static final String PAYRUN_BATCH_QUEUE = "payroll.payrun.batch.queue";
    public static final String PAYRUN_BATCH_ROUTING_KEY = "payroll.payrun.batch";

    @Bean
    public Queue payslipEmailQueue() {
        return QueueBuilder.durable(PAYSLIP_EMAIL_QUEUE)
                .withArgument("x-dead-letter-exchange", "")
                .build();
    }

    @Bean
    public Queue payrunBatchQueue() {
        return QueueBuilder.durable(PAYRUN_BATCH_QUEUE).build();
    }

    @Bean
    public DirectExchange payrollExchange() {
        return new DirectExchange(PAYROLL_EXCHANGE, true, false);
    }

    @Bean
    public Binding payslipEmailBinding(Queue payslipEmailQueue, DirectExchange payrollExchange) {
        return BindingBuilder.bind(payslipEmailQueue).to(payrollExchange).with(PAYSLIP_EMAIL_ROUTING_KEY);
    }

    @Bean
    public Binding payrunBatchBinding(Queue payrunBatchQueue, DirectExchange payrollExchange) {
        return BindingBuilder.bind(payrunBatchQueue).to(payrollExchange).with(PAYRUN_BATCH_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
